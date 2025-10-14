pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG = "latest"
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        DEPLOY_SERVER = 'deploy-server' // SSH credentials ID
        DEPLOY_PATH = '/root/backend-app'
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
                sshagent(credentials: ['root']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@206.189.150.2 "
                            set -e
                            echo 'Pulling new image...'
                            docker pull pacuong/backend-zma:latest

                            echo 'Restarting container...'
                            cd /root/backend-app
                            docker compose down
                            docker compose up -d --remove-orphans
                            docker image prune -f

                            echo '✅ Deploy thành công trên VPS'
                        "
                    '''
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
