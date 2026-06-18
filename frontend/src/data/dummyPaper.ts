import { Assessment } from "../types/assessment";

export const dummyPaper: Assessment = {
  id: "assessment-uuid-104b",
  title: "Introduction to Neural Networks and Deep Learning",
  description: "A comprehensive assessment testing basic and advanced understandings of neural networks, backpropagation, and CNNs.",
  difficulty: "medium",
  totalPoints: 25,
  timeLimit: 90,
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: "q1",
      text: "Explain the difference between L1 (Lasso) and L2 (Ridge) regularization methods. How do they affect model weights?",
      type: "long",
      points: 10,
      rubrics: [
        "Identifies mathematical differences (absolute vs square penalties)",
        "Explains sparsity generation (L1 forces coefficients to 0)",
        "Compares impact on handling multi-collinearity"
      ]
    },
    {
      id: "q2",
      text: "Which activation function is susceptible to the 'dying ReLU' problem where neurons get stuck and output constant zero?",
      type: "mcq",
      options: [
        "Sigmoid Function",
        "Rectified Linear Unit (ReLU)",
        "Hyperbolic Tangent (tanh)",
        "Leaky ReLU"
      ],
      correctAnswer: "Rectified Linear Unit (ReLU)",
      points: 5
    },
    {
      id: "q3",
      text: "In neural networks, backpropagation calculates the gradient of the loss function with respect to the weights using the chain rule.",
      type: "boolean",
      options: ["True", "False"],
      correctAnswer: "True",
      points: 5
    },
    {
      id: "q4",
      text: "Briefly explain the role of a stride parameter in Convolutional Neural Networks (CNNs).",
      type: "short",
      points: 5
    }
  ]
};
