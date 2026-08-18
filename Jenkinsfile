pipeline {
  agent any

  environment {
    UI_DIR = "/var/www/hrapp-ui/dist"
    NODE_ENV = "production"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install & Build') {
      steps {
        sh '''
          npm ci --include=dev
          npm run build
        '''
      }
    }

    stage('Deploy UI') {
      steps {
        sh '''
          rsync -av --delete dist/ ${UI_DIR}/
        '''
      }
    }

    stage('Reload NGINX') {
      steps {
        sh '''
          sudo systemctl reload nginx
        '''
      }
    }
  }

  post {
    success {
      echo "✅ HRAPP UI DEPLOYED SUCCESSFULLY"
    }
  }
}
