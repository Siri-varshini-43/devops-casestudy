
pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    options {
        timestamps()
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
                echo 'Source code downloaded successfully.'
            }
        }

        stage('Validate Project Files') {
            steps {
                script {
                    def requiredFiles = [
                        'index.html',
                        'style.css',
                        'script.js'
                    ]

                    for (file in requiredFiles) {
                        if (!fileExists(file)) {
                            error("Required file missing: ${file}")
                        }

                        echo "Found required file: ${file}"
                    }
                }
            }
        }

        stage('Validate HTML') {
            steps {
                script {
                    def html = readFile('index.html')

                    if (!html.toLowerCase().contains('<html')) {
                        error('HTML validation failed: HTML tag missing.')
                    }

                    if (!html.toLowerCase().contains('</html>')) {
                        error('HTML validation failed: closing HTML tag missing.')
                    }

                    echo 'HTML basic validation passed.'
                }
            }
        }

        stage('Validate JavaScript') {
            steps {
                script {
                    def js = readFile('script.js')

                    if (js.trim().isEmpty()) {
                        error('JavaScript validation failed: script.js is empty.')
                    }

                    echo 'JavaScript file is present and non-empty.'
                }
            }
        }

        stage('CI Build Complete') {
            steps {
                echo 'Student Study Planner passed all configured checks.'
                echo 'Continuous Integration pipeline completed successfully.'
            }
        }
    }

    post {
        success {
            echo 'BUILD SUCCESS: All configured checks passed.'
        }

        failure {
            echo 'BUILD FAILED: Check Console Output for details.'
        }
    }
}
