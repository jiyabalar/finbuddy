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
                echo 'Source code has been checked out from GitHub.'
            }
        }

        stage('Backend CI') {
            steps {
                dir('backend') {
                    stage('Install Backend Dependencies') {
                        sh 'npm install --no-audit --no-fund'
                    }

                    stage('Generate Prisma Client') {
                        sh 'npx prisma generate'
                    }

                    stage('Validate Prisma Schema') {
                        sh 'npx prisma validate'
                    }

                    stage('Backend Lint') {
                        sh 'npm run lint'
                    }

                    stage('Backend Tests') {
                        sh 'npm test'
                    }

                    stage('Backend Build') {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Frontend CI') {
            steps {
                dir('frontend') {
                    sh 'npm install --no-audit --no-fund'
                    sh 'npm run lint'
                    sh 'npm test'
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
