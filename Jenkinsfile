pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
        DEPLOY_PATH = "/root/backend-app"
    }

    stages {

        stage('Checkout Source') {
            steps {
                echo "📦 Cloning public repository..."
                sh "git clone -b main ${GIT_REPO} ."
            }
        }

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
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    """
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                echo "🚀 Deploying backend container..."
                withCredentials([
                    usernamePassword(
                        credentialsId: "${REGISTRY_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        cd ${DEPLOY_PATH}
                        docker compose pull
                        docker compose up -d --remove-orphans
                        docker image prune -f
                        echo "✅ Backend ZMA deployed successfully!"
                    """
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
