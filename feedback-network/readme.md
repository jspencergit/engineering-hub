# Feedback Network Analyzer

Welcome to the **Feedback Network Analyzer**, a web-based tool designed to visualize and analyze the frequency response of feedback networks commonly used in control systems and electronics engineering. This project allows users to interactively adjust parameters such as gain, poles, and zeros for the plant, compensator, and feedback components, and observe their effects on Bode plots in real time.

## Overview

The Feedback Network Analyzer provides an intuitive interface to:
- Model the frequency response of a plant, compensator, and feedback system.
- Visualize magnitude and phase responses using interactive Bode plots.
- Adjust parameters dynamically with sliders and text inputs.
- Calculate and display loop bandwidth and phase margin.
- Render transfer functions using MathJax for mathematical clarity.

This tool is particularly useful for engineers and students studying control systems, signal processing, or circuit design, offering a hands-on way to explore feedback network behavior.

## Features

- **Interactive Charts**: Four Bode plots (Plant Response, Compensator Response, Feedback Response, and Loop Gain) updated in real time.
- **Parameter Adjustment**: Modify gain, low-frequency (LF) poles, poles, and zeros with sliders and text inputs.
- **Dynamic Limits**: Adjust the range of slider inputs via a dedicated limits section.
- **Reset Functionality**: Restore all parameters to default values with a single button.
- **Mathematical Representation**: Transfer functions are displayed and typeset with MathJax.

## Getting Started

### Prerequisites

To run this project locally, ensure you have the following:
- A modern web browser (e.g., Chrome, Firefox, Edge) with JavaScript enabled.
- Internet connection (to load external dependencies like Chart.js and MathJax).

No additional software or server setup is required, as this is a static HTML/JavaScript application.

### Installation

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/jspencergit/engineering-hub.git
   cd engineering-hub/feedback-network