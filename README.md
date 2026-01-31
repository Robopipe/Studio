<p align="center">
  <img src="images/robopipe-cover-text.png" />
</p>

# 🚀 Advanced Industrial Machine Vision & AI Quality Inspection

**Revolutionizing automated defect detection and smart manufacturing through Deep Learning and Edge AI.**

Robopipe Studio is an open-source software designed for capturing and processing image data, labeling images, and training and deploying offline machine learning models on Edge-Compute hardware (Luxonis). It provides a user-friendly interface for managing image datasets, annotating images, and building offline computer vision applications.

## 📹 Capture, Label, Train and Infer

Operators can label and fine-tune datasets using an intuitive interface, specifically engineered to handle complex, non-rigid products where traditional rule-based vision systems fail. Optimized models are deployed via [robopipe API](https://github.com/Robopipe/API/tree/main) to Edge-Compute hardware (Luxonis) for real-time inference in manufacturing processes.

| ![Capture](https://cdn.prod.website-files.com/676e983aac02b65480d76ae2/691efe40601ae92796e9d44c_CAPTURE2-p-500.jpg) Capture |    ![Label](https://cdn.prod.website-files.com/676e983aac02b65480d76ae2/690d149215582d7c04bca6e6_label-p-500.png) Label     |
| :-------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------: |
|    ![Train](https://cdn.prod.website-files.com/676e983aac02b65480d76ae2/690d14abc269afc91d609691_train-p-500.png) Train     | ![Inference](https://cdn.prod.website-files.com/676e983aac02b65480d76ae2/690f974b25c665792d6e8e53_control2-p-500.jpg) Infer |

## 📑 Documentation

To learn more about Robopipe Studio, please visit the [Robopipe Documentation](https://robopipe.gitbook.io/robopipe).

## 🛠 Running the app

### From source

#### Prerequisites

- Pnpm v10.28.0 (or higher)
- Running PostgreSQL server v16 (or higher), with created database
  ```bash
  psql -c "create database robopipe;"
  ```
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

   ```bash
   pnpm install
   ```

4. Set up environment variables:

   ```bash
   cp apps/api/config.local.example.yml apps/api/config.local.yml
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   Then configure DATABASE_URL in app/api/.env and apps/api/config.local.yml according to your environment

5. Run the database migrations:

   ```bash
   pnpm -F api drizzle:push
   ```

6. Run the application:

   ```bash
   pnpm dev
   ```

7. Observe the app
   - The web is available at [localhost:5173](http://localhost:5173)
   - API docs are available at [localhost:3000/api](http://localhost:3000/api)

## 📬 Feedback

Robopipe values all your feedback. If you encounter any problems with the app, please open a [GitHub issue](https://github.com/Robopipe/Studio/issues/new) for anything related to this app - bugs, improvement suggestions, documentation, developer experience, etc.

## 👫 Community

Join our [Robopipe subreddit](https://www.reddit.com/r/robopipe/) to share your apps, ask any questions regarding Robopipe, get help debugging your apps, or simply to read more about Robopipe from our users.
