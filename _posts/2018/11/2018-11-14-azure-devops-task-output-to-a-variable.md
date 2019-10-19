---
title:  Azure DevOps - Task output to a variable
date:  2018-11-14 06:30:01 -05:00
permalink:  "/2018/11/14/azure-devops-task-output-to-a-variable/"
categories:
- Solution
tags:
- DevOps
---
<img style="float:right;padding-right:20px;" title="From http://pixabay.com" src="https://vincentlauzon.files.wordpress.com/2018/10/architecture-3357847_640-e1540928514340.jpg" />

I've been building a couple of Continuous Integration / Continuous Delivery (CI / CD) pipelines on <a href="https://docs.microsoft.com/en-us/azure/devops/user-guide/what-is-azure-devops-services?view=vsts">Azure DevOps</a> lately.

Azure DevOps is formerly known as Visual Studio Team Service (VSTS).  As <a href="https://vincentlauzon.com/2018/10/17/azure-dev-ops-ci-cd-pipelines-with-aks-lessons-learned/">I mentioned recently</a>, VSTS had nothing to do with Visual Studio and we're very happy with the new brand name.

With CI / CD, as with automation in general, I want the least code possible for maximum impact.

Something was missing in my tool belt.  I needed to carry information from a task to another.  I needed to get the output of a task and use it as the input of other tasks.

I struggled for a while before two of my colleagues (<a href="https://alwaysupalwayson.blogspot.com/">Mathieu Benoit</a> &amp; <a href="https://github.com/kwkraus">Kevin Kraus</a>) showed me how to do that.

It's a simple trick but one that isn't documented prominently, so I wanted to share that with you here.

<h2>A Use Case</h2>

Let's give an example where that technique was needed.  That was actually the scenario that triggered our search for an output variable technique.

We wanted to manage the version of a micro service with <a href="https://semver.org/">Semantic Versioning</a>, i.e. MAJOR.MINOR.PATCH.

For us, the MAJOR &amp; MINOR belong to the code as it relates to compatibility and feature set.  The PATCH part didn't and it would be error prone to expect programmers to update a patch number in the code base each time they deploy something.  We were keen to use the build number of Azure Dev Ops.  That number increments each time there is a build.

We also wanted the full version (i.e. MAJOR.MINOR.PATCH) to be injected in the code so it could be returned as a service version.  This way we have an easy way to identify which version of a service we are talking to.

This is a schematized version of our build pipeline:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/version1.png" alt="Version management" />

<table>
<thead>
<tr>
  <th>Task</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Fetch Full Version</td>
  <td>Python task taking the build number as an input.  It fetches the MAJOR.MINOR version from the code files, append the build number and set the <em>Full Version</em> variable.</td>
</tr>
<tr>
  <td>Write Full Version</td>
  <td>We write the <em>Full Version</em> variable as a build artefact.  This will be used at release time.</td>
</tr>
<tr>
  <td>Inject Version in code</td>
  <td>Python task taking the <em>Full Version</em> variable and performing a simple find / replace in the code.  This will allow the service to return the full version.</td>
</tr>
<tr>
  <td>Build Docker Image</td>
  <td>Builds a Docker from the code.  This doesn't directly use the <em>Full Version</em> variable.</td>
</tr>
<tr>
  <td>Push Docker Image</td>
  <td>Pushes the Docker image to Docker Hub.  We use the <em>Full Version</em> as the image <em>tag</em>.</td>
</tr>
<tr>
  <td>Helm Package</td>
  <td>Packages an Helm Chart.  We use the <em>Full Version</em> as the chart version.</td>
</tr>
</tbody>
</table>

It's easy to see that without an output variable, this pipeline would be very tedious.

<h2>The Solution</h2>

The solution is pretty straightforward.  It doesn't require calling an API or an SDK, just to output something on the console:

```text
##vso[task.setvariable variable=<variable name>;]<variable value>
```

That's it!

Azure DevOps will automatically pick it up.  So we can do that from Python, PowerShell, Bash shell, anything that can output to the console.

For instance, our Python line was:

```python
print('##vso[task.setvariable variable=full-version;]%s' % (fullVersion))
```

The variable we defined here is then instantiated as a variable in Azure DevOps and can be used by subsequent tasks in the same pipeline.

Here we used it in a build.  The same thing can be done in a release pipeline.

<h2>Summary</h2>

Something simple that I found extremely useful in some pipeline.

It allows us to couple loosely tasks together.  The alternative is having tasks do more while they hold the state of what should be a variable.