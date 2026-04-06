# Hawtio AI Plugin

[![Build](https://github.com/hawtio/hawtio-ai-plugin/actions/workflows/build.yml/badge.svg)](https://github.com/hawtio/hawtio-ai-plugin/actions/workflows/build.yml)

This is an extension plugin that adds AI functionality to Hawtio. This plugin is intended for use with [Hawtio v5](https://github.com/hawtio/hawtio).

## Installation

### Maven

```xml
<dependency>
    <groupId>io.hawt.ai</groupId>
    <artifactId>hawtio-ai-plugin</artifactId>
    <version>0.1-SNAPSHOT</version>
</dependency>
```

### NPM

```console
npm i @hawtio/ai-plugin
```

Yarn

```console
yarn add @hawtio/ai-plugin
```

## Development

### Key components

The key components of the project are as follows:

| Components | Description |
| ---------- | ----------- |
| [hawtio-ai-plugin](./plugin) | Hawtio AI plugin itself; TypeScript project. |
| [hawtio-ai-plugin-test-app](./app) | Test project for developing the Hawtio AI plugin, based on Spring Boot. |

### Build

```console
mvn clean install
```

### Run the test app

```console
mvn spring-boot:run -pl app -Dskip.yarn
```

The test application's Hawtio console can be accessed at: <http://localhost:8080/hawtio/>

### Develop

> [!NOTE]
> **Faster plugin development cycle**
>
> You can develop a plugin step by step by running `mvn install` or `mvn spring-boot:run` while checking the behaviour in the browser each time, but in this way you cannot run a quick development feedback cycle.
> 
> You can instead develop the frontend project of the plugin in a fast feedback cycle by running the test application on the backend while starting the plugin itself in development mode with `yarn start`, as follows.

To develop the plugin, firstly launch the test application on the backend:

```console
mvn spring-boot:run -Dskip.yarn
```

Then, in another terminal, start the plugin project in development mode:

```console
cd plugin
yarn start
```

Now you should be able to preview the plugin under development at <http://localhost:3001/hawtio/>. However, since it still hasn't been connected to a backend JVM, you can only test features that don't require the JMX MBean tree.

To test the features that depend on the JMX MBean tree, use Connect plugin <http://localhost:3001/hawtio/connect> to connect to the test application running in the background. The Jolokia endpoint should be available at <http://localhost:8080/hawtio/jolokia>.

Now you can preview all kinds of features provided by the plugin on the console under development, and run a faster development cycle by utilising hot reloading provided by Webpack.
