pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                echo "📥 Installing dependencies..."
                sh "npm install"
            }
        }

        stage('Build Project') {
            steps {
                echo "🏗️ Building NestJS project..."
                sh "npm run build"
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "📤 Pushing image to Docker Hub..."
                withCredentials([
                    usernamePassword(
                        credentialsId: "${REGISTRY_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    '''
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                echo "🚀 Deploying backend container on remote server..."
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'aws-ssh-key',
                        keyFileVariable: 'SSH_KEY'
                    ),
                    usernamePassword(
                        credentialsId: "${REGISTRY_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@3.27.31.160 << EOF
                        echo "📦 Pulling latest image from Docker Hub..."
                        docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}

                        echo "🧹 Stopping old container (if any)..."
                        docker stop backend-zma || true
                        docker rm backend-zma || true

                        echo "🚀 Running new container..."
                        docker run -d --name backend-zma -p 5000:8080 ${DOCKER_IMAGE}:${DOCKER_TAG}

                        echo "✅ Backend ZMA deployed successfully!"
                        EOF
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ CI/CD pipeline completed successfully!"
        }
        failure {
            echo "❌ CI/CD pipeline failed. Check Jenkins logs for details."
        }
    }
}
