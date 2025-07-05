Nexus: JSON Visualizer
======================

Nexus is a super handy, single-page React app that turns your tricky JSON data into a clear, interactive graph. It's designed to help you easily see how everything connects and is organized within those big JSON files.

Why Nexus is Awesome
--------------------

Working with JSON, especially when it's all nested, can be a real headache for developers and data folks. Nexus swoops in to save the day, making it simple to grasp your data at a glance! Plus, **since it's open-source, your data stays right on your computer. That means total privacy and you're always in control – no worries!**

Cool Features
-------------

*   **Interactive Visuals:** Check out your JSON data in a graph you can drag around, zoom in and out of, and even pan! Super easy to explore.

*   **Smart Layout:** It automatically arranges all the nodes and connections based on how your data is structured. No manual fiddling needed!

*   **Easy-Peasy Interface:** Just paste your JSON in! It's designed to be simple and straightforward.

*   **Error Catcher:** If you accidentally paste some bad JSON, Nexus will spot it and let you know. Handy, right?


How to Get Started
------------------

Getting Nexus up and running is a breeze with Docker:

1.  **Build It:**

        docker build -t nexus .

2.  **Run It:**

        docker run --rm -i -t -p 3000:80 nexus


Once those commands are done, just open your browser and head to `http://localhost:3000`. The app will pop right up, ready for you to visualize your JSON data!
