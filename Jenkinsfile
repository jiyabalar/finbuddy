pipeline {
    agent any

    tools {
        nodejs 'NodeJS26'
    }

    options {
        timestamps()
    }

    environment {
        DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci?schema=public'
        JWT_SECRET = 'ci-test-secret'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'FinBuddy CI pipeline started!'
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
    }

    post {
        success {
            echo 'SUCCESS: FinBuddy CI pipeline completed!'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output for details.'
        }

        always {
            echo 'FinBuddy CI pipeline finished.'
        }
    }
}