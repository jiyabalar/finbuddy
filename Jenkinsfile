pipeline {
    agent any

    tools {
        nodejs 'NodeJS26'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci?schema=public'
        JWT_SECRET = 'ci-test-secret'
        COMPOSE_PROJECT_NAME = 'finbuddy'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'FinBuddy CI/CD pipeline started!'
                echo 'Source code checked out from GitHub.'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install --no-audit --no-fund'
                }
            }
        }

        stage('Generate Prisma Client') {
            steps {
                dir('backend') {
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Validate Prisma Schema') {
            steps {
                dir('backend') {
                    sh 'npx prisma validate'
                }
            }
        }

        stage('Backend Lint') {
            steps {
                dir('backend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install --no-audit --no-fund'
                }
            }
        }

        stage('Frontend Lint') {
            steps {
                dir('frontend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Validate Docker Compose') {
            steps {
                sh 'docker-compose -p finbuddy config --quiet'
                echo 'Docker Compose configuration is valid.'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building FinBuddy Docker images...'
                sh 'docker-compose -p finbuddy build'
            }
        }

        stage('Deploy FinBuddy') {
            steps {
                echo 'Deploying FinBuddy locally using Docker Compose...'
                sh 'docker-compose -p finbuddy up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Checking that FinBuddy containers are running...'

                sh '''
                    docker-compose -p finbuddy ps

                    for service in postgres backend frontend; do
                        status=$(docker-compose -p finbuddy ps --status running -q "$service")

                        if [ -z "$status" ]; then
                            echo "ERROR: Service $service is not running."
                            docker-compose -p finbuddy logs --tail=50 "$service"
                            exit 1
                        fi

                        echo "SUCCESS: $service container is running."
                    done
                '''
            }
        }

        stage('Frontend HTTP Health Check') {
            steps {
                echo 'Checking whether the deployed frontend responds over HTTP...'

                sh '''
                    for attempt in $(seq 1 12); do
                        if curl -fsS http://host.docker.internal:5173/ -o /dev/null; then
                            echo "SUCCESS: FinBuddy frontend is responding over HTTP."
                            exit 0
                        fi

                        echo "Frontend is not ready yet. Attempt $attempt of 12."
                        sleep 5
                    done

                    echo "ERROR: Frontend did not respond within 60 seconds."
                    docker-compose -p finbuddy logs --tail=50 frontend
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: FinBuddy CI/CD pipeline completed!'
            echo 'FinBuddy deployment has been verified.'
            echo 'Frontend: http://localhost:5173'
            echo 'Backend: http://localhost:4000'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output for details.'
        }

        always {
            echo 'FinBuddy CI/CD pipeline finished.'
        }
    }
}