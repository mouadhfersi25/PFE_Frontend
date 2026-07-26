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

        stage('Deploy Frontend Kubernetes') {
            environment {
                TAG = "${env.BUILD_NUMBER}"
            }
            steps {
                sh '''
                    set -eu
                    # Remplace le tag image dans le manifeste puis applique
                    sed "s|IMAGE_PLACEHOLDER|${IMAGE}:${TAG}|g" k8s/frontend-deployment.yaml > /tmp/frontend-deployment.yaml
                    kubectl apply -f /tmp/frontend-deployment.yaml
                    kubectl apply -f k8s/frontend-service.yaml
                    kubectl rollout status deployment/edugame-frontend --timeout=180s
                    echo "Deploy OK : ${IMAGE}:${TAG}"
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
