<p align="center">
  <img src="images/robopipe-cover-text.png" />
  <h1 align="center">Robopipe Studio</h1>
</p>

Robopipe Studio is an open-source software designed for capturing and processing image data, labeling images, and training and deploying machine learning models. It provides a user-friendly interface for managing image datasets, annotating images, and building computer vision applications.

## Documentation

To learn more about Robopipe Studio, please visit the [Robopipe Documentation](https://robopipe.gitbook.io/robopipe).

## Running the app

### Using Docker

#### Prerequisites

- Docker

1. Clone the repository:

   ```bash
   git clone https://github.com/Robopipe/Studio.git
   ```

2. Build the Docker image:

   ```bash
   cd Studio
   docker build -t robopipe-studio .
   ```

3. Run the Docker container:

   ```bash
   docker run -p 8000:8000 robopipe-studio
   ```

### From source

#### Prerequisites

- Python 3.8 or higher
- Git

1. Clone the repository:

   ```bash
   git clone https://github.com/Robopipe/Studio.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Studio
   ```

3. Install the required dependencies:

   a) Install dependencies for API:

   ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    python3 -m pip install poetry
    poetry install
    python3 label_studio/manage.py collectstatic
   ```

   (optional) Install base NN models:

   ```bash
    python3 label_studio/manage.py installmodels --all
   ```

   b) Install dependencies for Frontend:

   ```bash
    cd web
    yarn install
   ```

4. Build the frontend:

   ```bash
   yarn ls:build
   ```

5. Run the application:

   ```bash
   cd ..
   python3 label_studio/manage.py runserver
   ```

## Feedback

Robopipe values all your feedback. If you encounter any problems with the app, please open a [GitHub issue](https://github.com/Robopipe/Studio/issues/new) for anything related to this app - bugs, improvement suggestions, documentation, developer experience, etc.

## Community

Join our [Robopipe subreddit](https://www.reddit.com/r/robopipe/) to share your apps, ask any questions regarding Robopipe, get help debugging your apps, or simply to read more about Robopipe from our users.
