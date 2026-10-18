pipeline {
agent any

```
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
            echo 'Starting FinBuddy CI pipeline'
            echo 'Checking out the source code through Jenkins SCM configuration'
        }
    }

    stage('Backend CI') {
        steps {
            dir('backend') {
                echo 'Installing backend dependencies'
                sh 'npm install --no-audit --no-fund'

                echo 'Generating Prisma client'
                sh 'npx prisma generate'

                echo 'Validating Prisma schema'
                sh 'npx prisma validate'

                echo 'Running backend lint'
                sh 'npm run lint'

                echo 'Running backend tests'
                sh 'npm test'

                echo 'Building backend'
                sh 'npm run build'
            }
        }
    }

    stage('Frontend CI') {
        steps {
            dir('frontend') {
                echo 'Installing frontend dependencies'
                sh 'npm install --no-audit --no-fund'

                echo 'Running frontend lint'
                sh 'npm run lint'

                echo 'Running frontend tests'
                sh 'npm test'

                echo 'Building frontend'
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
        echo 'FAILED: Check the Jenkins console output for details.'
    }

    always {
        echo 'FinBuddy CI pipeline finished.'
    }
}
```

}
