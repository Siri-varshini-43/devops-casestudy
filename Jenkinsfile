
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
                echo 'Source code downloaded from GitHub.'
            }
        }

        stage('Validate Project Files') {
            steps {
                script {
                    def requiredFiles = [
                        'app.py',
                        'requirements.txt',
                        'templates/index.html',
                        'static/style.css',
                        'static/scripts.js'
                    ]

                    for (file in requiredFiles) {
                        if (!fileExists(file)) {
                            error("Required file missing: ${file}")
                        }

                        echo "PASS: Found ${file}"
                    }
                }
            }
        }

        stage('Validate HTML') {
            steps {
                script {
                    def html = readFile('templates/index.html').toLowerCase()

                    if (!html.contains('<html')) {
                        error('Opening HTML tag is missing.')
                    }

                    if (!html.contains('</html>')) {
                        error('Closing HTML tag is missing.')
                    }

                    echo 'PASS: HTML structure validated.'
                }
            }
        }

        stage('Validate CSS') {
            steps {
                script {
                    def css = readFile('static/style.css')

                    if (css.trim().isEmpty()) {
                        error('CSS file is empty.')
                    }

                    echo 'PASS: CSS file validated.'
                }
            }
        }

        stage('Validate JavaScript') {
            steps {
                script {
                    def js = readFile('static/scripts.js')

                    if (js.trim().isEmpty()) {
                        error('JavaScript file is empty.')
                    }

                    echo 'PASS: JavaScript file validated.'
                }
            }
        }

        stage('CI Complete') {
            steps {
                echo 'All configured checks passed.'
                echo 'Flask application source validation completed.'
            }
        }
    }

    post {
        success {
            echo 'BUILD SUCCESS: Flask application validated.'
        }

        failure {
            echo 'BUILD FAILED: Check Console Output.'
        }
    }
}
