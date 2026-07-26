pipeline {
    agent any

    tools {
        // Nom exact dans Jenkins : Manage Jenkins > Tools > NodeJS
        nodejs 'Nodejs'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE = 'mouadhfersi/edugame-frontend'
        CONTAINER_NAME = 'edugame-frontend'
        // Port hote Jenkins -> port 80 nginx dans le conteneur
        APP_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    set -eu
                    node -v
                    npm -v
                    npm ci
                    npm run build
                '''
                // Vite sort les assets dans dist/
                archiveArtifacts artifacts: 'dist/**', fingerprint: true, allowEmptyArchive: false
            }
        }

        stage('Tests & Coverage') {
            steps {
                sh '''
                    set -eu
                    # React/Vite : activer quand un script "test" existe (ex. Vitest)
                    if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"; then
                        npm test -- --run --coverage
                    else
                        echo "Aucun script npm test — stage ignoree (ajouter Vitest + coverage plus tard)."
                    fi
                '''
            }
        }

        stage('Analyse SonarQube') {
            steps {
                withSonarQubeEnv(installationName: 'SonarQube',
                                 credentialsId: 'sonarqube-token') {
                    sh '''
                        set -eu
                        npx --yes sonarqube-scanner
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                withSonarQubeEnv(installationName: 'SonarQube',
                                 credentialsId: 'sonarqube-token') {
                    sh '''
                        set -eu
                        node scripts/wait-quality-gate.js
                    '''
                }
            }
        }

        stage('Image Docker') {
            environment {
                TAG = "${env.BUILD_NUMBER}"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-token',
                                                   usernameVariable: 'REG_USER',
                                                   passwordVariable: 'REG_PASS')]) {
                    sh '''
                        set -e
                        echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin
                        docker build -t "$IMAGE:$TAG" -t "$IMAGE:latest" .

                        push_with_retry() {
                            ref="$1"
                            for attempt in 1 2 3 4 5; do
                                if docker push "$ref"; then
                                    return 0
                                fi
                                echo "Push echoue (tentative $attempt/5), nouvel essai dans 10s..."
                                sleep 10
                            done
                            return 1
                        }

                        push_with_retry "$IMAGE:$TAG"
                        push_with_retry "$IMAGE:latest"
                        docker logout || true
                        echo "Image publiee : $IMAGE:$TAG"
                    '''
                }
            }
        }

        stage('Deploy') {
            environment {
                TAG = "${env.BUILD_NUMBER}"
            }
            steps {
                sh '''
                    set -eu
                    echo "Deploiement Docker de $IMAGE:$TAG"

                    docker pull "$IMAGE:$TAG"

                    docker stop "$CONTAINER_NAME" 2>/dev/null || true
                    docker rm "$CONTAINER_NAME" 2>/dev/null || true

                    docker run -d \
                      --name "$CONTAINER_NAME" \
                      --restart unless-stopped \
                      -p "${APP_PORT}:80" \
                      "$IMAGE:$TAG"

                    echo "Conteneur demarre : $CONTAINER_NAME ($IMAGE:$TAG) sur le port $APP_PORT"
                    docker ps --filter "name=$CONTAINER_NAME"
                '''
            }
        }
    }

    post {
        always {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
