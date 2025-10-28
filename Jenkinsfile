pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG   = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: "${GIT_REPO}", credentialsId: 'gh_token'
            }
        }

        stage('Install & Build Project') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
            }
        }
    }
    post {
        success { echo "✅ Pipeline completed successfully!" }
        failure { echo "❌ Pipeline failed, check logs." }
    }
}
