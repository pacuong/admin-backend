pipeline {
    agent {
        docker {
            image 'node:20'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        GIT_REPO = "https://github.com/pacuong/admin-backend.git"
        DOCKER_IMAGE = "pacuong/backend-zma"
        DOCKER_TAG   = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                withCredentials([usernamePassword(credentialsId: 'gh_token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh '''
                        git clone https://$GIT_USER:$GIT_TOKEN@github.com/pacuong/admin-backend.git .
                        git checkout main
                    '''
                }
            }
        }

        stage('Build') {
            steps {
                sh '''
                    npm install
                    npm run build
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    '''
                }
            }
        }
    }

    post {
        success { echo "✅ Build & Push success!" }
        failure { echo "❌ Build failed, check logs!" }
    }
}
