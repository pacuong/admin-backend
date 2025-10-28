pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG   = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-creds'     // 👈 trùng với ID bạn đặt trong Jenkins
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "🔄 Checking out source code from GitHub..."
                git branch: 'main', url: "${GIT_REPO}", credentialsId: 'gh_token'
            }
        }

        stage('Install & Build Project') {
            steps {
                echo "📦 Installing dependencies..."
                sh '''
                    npm install
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image ${DOCKER_IMAGE}:${DOCKER_TAG}..."
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "📤 Pushing image to Docker Hub..."
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                echo "🚀 Deploying to remote server..."
                sshagent(['ssh-pacuong']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no pacuong@3.27.31.160 '
                            docker pull ${DOCKER_IMAGE}:${DOCKER_TAG} &&
                            docker stop backend-zma || true &&
                            docker rm backend-zma || true &&
                            docker run -d --name backend-zma -p 3000:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}
                        '
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed — check Jenkins logs."
        }
    }
}
