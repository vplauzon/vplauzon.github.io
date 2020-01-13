---
title: Alerts on Azure Function failures
date: 2019-11-01 03:30:22 -07:00
permalink: /2019/11/01/alerts-on-azure-function-failures/
categories:
- Solution
tags:
- Operations
- Serverless
---
<img style="float:right;padding-right:20px;" title="From pexels.com" src="/assets/posts/2019/4/alerts-on-azure-function-failures/disgusting-fail-failure-2882-e1572544776280.jpg" />

So, you have a few functions running.  Maybe some of those functions are important and you would like to be alerted when they fail.

In this article I'll cover that exact scenario.  We will do that in the following steps:

<ul>
<li>Deploy a recurrent function which fails %50 of the time (by design)</li>
<li>Define a query we can use for alerts</li>
<li>Define an alert</li>
<li>Sit back and wait for the alerts to pop in</li>
</ul>

This could be useful in many scenarios.  Maybe you do want to get notify when some serverless compute fail before an end-user pick up the phone.  Or maybe those are jobs running in the background and it would take a while to notice.  You might want to detect failures and simply the fact the job didn't run.

As usual, the <a href="https://github.com/vplauzon/function/tree/master/alert-run-failed">code is on GitHub</a>.

<h2>Deploying the sample solution</h2>

Let's go ahead and deploy our sample solution:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Ffunction%2Fmaster%2Falert-run-failed%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The ARM Template has 2 arguments:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>storageAccountName</td>
  <td>Name of storage account.  The storage account is used by the function app.</td>
</tr>
<tr>
  <td>functionAppName</td>
  <td>Name of function app.  The name needs to be globally unique as it is mapped to a DNS entry.</td>
</tr>
</tbody>
</table>

It is <strong>important to deploy the solution in a region where Azure <a href="https://azure.microsoft.com/en-us/global-infrastructure/services/?products=monitor">Application Insights is available</a></strong>.  The region is inherited from the resource group's region if it is pre-existing.

This template should deploy the following resources:

<img src="/assets/posts/2019/4/alerts-on-azure-function-failures/resources.png" alt="Resources" />

Let's go in the function, i.e. the <em>App Service</em> resource.

There should be one function deployed there:  <em>recurrent-function</em>.

Note:  the function was <a href="https://github.com/vplauzon/function/blob/master/alert-run-failed/deploy.json#L120">deployed inline</a> via the ARM Template using the trick found in <a href="https://github.com/Azure/azure-quickstart-templates/tree/master/201-logic-app-transform-function">this quickstart template</a>.

If we look at the code of that function:

```csharp
using System;

public static void Run(TimerInfo myTimer, ILogger log)
{
    var isSuccess = (new Random().NextDouble()) < .5;

    log.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");

    if(isSuccess)
    {
        log.LogInformation($"Success");
    }
    else
    {
        log.LogInformation($"Failure");

        throw new ApplicationException("Failure");
    }
}
```

We can see why the function fails %50 of the time.  We use a random number and basically flip a coin at each call.

We can run the function a few times and see it failing and succeeding.

If we look at the function monitoring (available since we hooked up Azure Application Insights), after a while we should see a profile like this:

<img src="/assets/posts/2019/4/alerts-on-azure-function-failures/runs.png" alt="Function runs" />

If we look at the <em>Integrate</em> menu item, we can see the <em>Cron expression</em> <code>0 */10 * * * *</code> attached as a schedule.  This means the function is set to run every 10 minutes.

<h2>Queries</h2>

Alerts are based on log queries.  Let's go in Application Insights and develop a query that could help us detecting failures.

<img src="/assets/posts/2019/4/alerts-on-azure-function-failures/log-pane.png" alt="Log pane" />

The Application Insights tables are displayed on the left.  If we double-click on the <em>requests</em> table name it should appear in the query window.  Alternatively, we can simply type it:

```sql
requests
```

We can then press <em>SHIFT-ENTER</em> or click the <em>Run</em> button to see all the requests recorded in the App Insights' instance.

Let refine the query by looking only for our function.  This is redundant in our case since there is only one function but in a more realistic context, it would be useful to filter against other workloads:

```sql
requests
| where timestamp > ago(30m)
| where name=="recurrent-function"
| sort by timestamp desc 
```

We could also filter against <em>cloud_RoleName</em>, which should be the name of the function app (globally unique, hence we didn't include it here).

Here we also sorted by <em>timestamp</em> in order to see the requests in order.  We also filter for the requests of the last <em>30 minutes</em>.  This is recommended to accelerate the queries.

We could also discriminate for only the successful requests:

```sql
requests
| where timestamp > ago(30m)
| where name=="recurrent-function"
| where success==true
| sort by timestamp desc 
```

This gives us all the <em>successful</em> requests of the last 30 minutes.

This could be a base for an alert.  Since the function is supposed to run every 10 minutes, we should expect to see a successful request every 10 minute.  If we don't, it means the function didn't run or failed.

Azure Application Analytics takes a few minutes to make the telemetry available.  It is usually done under 10 minutes.

<h2>Setting up alerts</h2>

To setup an alert, let's click on the <em>+ New alert rule</em> button.

<img src="/assets/posts/2019/4/alerts-on-azure-function-failures/new-alert-rule.png" alt="New Alert rule" />

We'll first setup the condition.  In the alert logic, we'll leave the <em>Based on Number of results</em> and set the <em>Operator</em> to <em>Less than</em> and the <em>Threshold value</em> to <em>1</em>.  We'll then set the <em>Period (in minutes)</em> to 10 and the <em>Frequency (in minutes)</em> to 5.

So basically, the alert is going to check every 5 minutes if the query we wrote, ran over the last 10 minutes (basically it overrides our <code>where timestamp &amp;gt; ago(30m)</code>) and if there is less than one result, an alert is going to be raised.

We are going to setup an <em>action group</em> to send us an email.

Finally, we can name the alert <em>Function failure</em>.

We can then create the alert.

<h2>Awaiting alerts</h2>

We can now wait for alerts.  Basically, every 10 minutes we will have %50 chance of receiving an email.

We can look at the function <em>Monitor</em> pane to see when the function fails and when it succeeds.  Emails should follow the same pattern.

<img src="/assets/posts/2019/4/alerts-on-azure-function-failures/monitor.png" alt="Monitor" />

<h2>Summary</h2>

Although this scenario was specific, it is quite easy to generalize it.

An alert is always based on a query on the telemetry.  If we can formulate a query revealing bad behaviours, we can setup an alert on those behaviours.

This is part of the automation of a solution.  We do not want to wait for our end users to discover that our site is slow or that some operations are failing.  We want to be pro-active.  For that we need visibility and alerts are a great way to make us aware of what is going on.

Of course, alerts are not the only tool at our disposal.  Plots &amp; dashboard can also help.  In our case, we could have plotted the success rate of the function.

Customers often ask me "<em>what should be our alerts</em>"?  Although there are a couple of classics such as page load time, request time, exceptions, etc.  , the truth is every solution is different and you learn when you operate it what is normal and what is not.  At first you might be blind on some metrics and oversensitive to others.  Only with time and experience will you fine tune those and have a well-rounded alerting system.