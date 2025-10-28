pipeline {
    agent any

    environment {
        // Docker image info
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG   = "latest"

        // Jenkins credentials IDs
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        SSH_CREDENTIALS      = 'aws-ssh-key'

        // Git repository
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "📥 Cloning repository..."
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📦 Installing Node.js dependencies..."
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

        stage('Push Docker Image') {
            steps {
                echo "📤 Pushing Docker image to Docker Hub..."
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

        stage('Deploy to Remote Server') {
            steps {
                echo "🚀 Deploying container on remote server..."
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIALS}",
                        keyFileVariable: 'SSH_KEY'
                    ),
                    usernamePassword(
                        credentialsId: "${REGISTRY_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        # Login Docker on remote host
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        # SSH to remote server
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@3.27.31.160 << 'EOF'
                            echo "📦 Pulling latest image..."
                            docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}

                            echo "🧹 Stopping old container..."
                            docker stop backend-zma || true
                            docker rm backend-zma || true

                            echo "🚀 Running new container..."
                            docker run -d --name backend-zma -p 5000:8080 ${DOCKER_IMAGE}:${DOCKER_TAG}

                            echo "✅ Deployment complete!"
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
            echo "❌ CI/CD pipeline failed! Check logs for details."
        }
    }
}
