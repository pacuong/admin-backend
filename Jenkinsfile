pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        DEPLOY_SERVER = 'deploy-server' // SSH credentials ID
        DEPLOY_PATH = '/home/ubuntu/backend-app'
        GIT_REPO = 'https://github.com/pacuong/admin-backend'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: "${GIT_REPO}",
                    credentialsId: 'github-pat'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Project') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    """
                }
            }
        }

        stage('Deploy to VPS') {
            steps {
                sshagent (credentials: ["${DEPLOY_SERVER}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@206.189.150.2 << 'EOF'
                        set -e
                        cd ${DEPLOY_PATH}

                        echo 'Pulling new image...'
                        docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}

                        echo 'Restarting container...'
                        docker compose down
                        docker compose up -d --remove-orphans

                        docker image prune -f
                        EOF
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deploy thành công!'
        }
        failure {
            echo '❌ Deploy thất bại!'
        }
    }
}
