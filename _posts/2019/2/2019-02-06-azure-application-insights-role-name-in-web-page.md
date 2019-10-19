---
title:  Azure Application Insights Role Name in web page
date:  2019-02-06 06:30:40 -05:00
permalink:  "/2019/02/06/azure-application-insights-role-name-in-web-page/"
categories:
- Solution
tags:
- DevOps
- Web
---
<img style="float:right;padding-right:20px;" title="From Pixabay" src="https://vincentlauzon.files.wordpress.com/2018/12/archive-1850170_640-e1543861761364.jpg" />

We discussed using <em>Role Name</em> to separate telemetries from different applications in <a href="https://vincentlauzon.com/2019/01/23/azure-application-insights-role-name-nuget-package/">a previous article</a>.

We discuss the <a href="https://www.nuget.org/packages/AppInsights.TelemetryInitializers/">Nuget package I developed</a> to set the role name for each telemetry in a backend application.

In this article I wanted to cover another element that receives little coverage:  how to do that for the HTML / JavaScript part of an application.

This is short and sweat but hopefully useful to better manage telemetry.

<h2>How to setup Application Insights for web apps</h2>

This part is <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-javascript#add-the-sdk-script-to-your-app-or-web-pages">well documented online</a>.

Basically, it boils down to adding a <a href="https://docs.microsoft.com/en-us/azure/application-insights/app-insights-javascript#add-the-sdk-script-to-your-app-or-web-pages">piece of JavaScript</a> to our web pages.  That code should contain the Instrumentation Key of Azure Application Insight.

By default, this doesn't provide a role name.  So, all apps will log against the same (empty) role name.

<h2>How to setup role name</h2>

Similarly to what we did for back-end applications, the JavaScript SDK exposes <a href="https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md#addtelemetryinitializer">telemetry initializers</a>.

We can therefore easily set the role name for each telemetry with:

```javascript
...
window.appInsights = appInsights;

appInsights.queue.push(function () {
    appInsights.context.addTelemetryInitializer(function (envelope) {
        envelope.tags["ai.cloud.role"] = "PasWorkbench-html";
    });
});
```

Doing this in each web page will ensure telemetries will be logged against that role name.

<h2>Summary</h2>

We just saw how to adapt the role name to the html / JavaScript code.

This is good for all telemetries originating from the front-end, i.e. either page views or API calls.