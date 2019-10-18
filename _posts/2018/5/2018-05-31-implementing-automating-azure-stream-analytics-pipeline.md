---
title:  Implementing & Automating Azure Stream Analytics Pipeline
date:  05/31/2018 10:30:32
permalink:  "/2018/05/31/implementing-automating-azure-stream-analytics-pipeline/"
categories:
- Solution
tags:
- Automation
- Data
- Integration
- Serverless
- Streaming
---
<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/clouds-dawn-dusk-210186.jpg"><img style="float:right;display:inline;background-image:none;" title="clouds-dawn-dusk-210186" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/clouds-dawn-dusk-210186_thumb.jpg" alt="clouds-dawn-dusk-210186" width="320" height="194" align="right" border="0" /></a>In <a href="https://vincentlauzon.com/2018/05/22/taming-the-fire-hose-azure-stream-analytics/">our last article</a>, we set out to build a resilient architecture around streaming events.

In this article, we are going to build the solution.  We are going to use an <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-manager-create-first-template">ARM template</a> which automates deployment.  We will also go through the configuration of different services.

The goal of the architecture was to allow a fast pace stream of events with a shape akin to

[code language="JavaScript"]

{

  &quot;widgetId&quot; : 42

}

[/code]

to be simply aggregated at constant intervals (say once a minute).  We wanted the solution to be resilient to different service failures.

We ended up with the following architecture:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb6.png" alt="image" border="0" /></a>

We have two <a href="https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-what-is-event-hubs">Azure Event Hubs</a> as ingestion mechanism.  One in the primary region of the workload, one in a secondary region.  The fallback mechanism is assumed by the source, i.e. the agent pushing the events to event hubs.

Events are captured in blob storage.

Events are then processed by <a href="https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-introduction">Azure Stream Analytics</a>.  It computes aggregation and pushes aggregation events into a third event hub.

Finally, an <a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Azure Logic App</a> consumes the summary events and update a SQL database.

We recommend reading the <a href="https://vincentlauzon.com/2018/05/22/taming-the-fire-hose-azure-stream-analytics/">previous article</a> to understand each aspect of the architecture.
<h2>ARM Template</h2>
The ARM Template to deploy the solution is <a href="https://github.com/vplauzon/streaming/tree/master/SummaryStreaming">available on GitHub</a>.  We can also deploy it from the following button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fstreaming%2Fmaster%2FSummaryStreaming%2FDeployment%2Fazuredeploy.json" rel="nofollow">
<img style="max-width:100%;" src="https://camo.githubusercontent.com/9285dd3998997a0835869065bb15e5d500475034/687474703a2f2f617a7572656465706c6f792e6e65742f6465706c6f79627574746f6e2e706e67" />
</a>

The template takes a few minutes to deploy.  It is fully functional after deployment, i.e. we aren’t required to run additional scripts.

The template has the following input parameters:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Name</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>Namespace prefix</td>
<td>Prefix for Event Hub namespaces.

There is a primary and secondary namespaces.  They must have globally unique names.  This parameter controls their names.</td>
</tr>
<tr>
<td>Storage Account Name</td>
<td>Name for the storage account where the events are stored.</td>
</tr>
<tr>
<td>SQL Admin Password</td>
<td>Password for the SQL Server.</td>
</tr>
</tbody>
</table>
The template also outputs three fields:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Name</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>Primary Telemetry Send Connection String</td>
<td>Connection string to the telemetry connection string.

This is using the “send authorization rule” which allows to send events to the hub.</td>
</tr>
<tr>
<td>Secondary Telemetry Send Connection String</td>
<td>Similar to previous but for secondary telemetry hub.</td>
</tr>
<tr>
<td>SQL Summary Connection String</td>
<td>This is an ADO.NET connection string to the SQL database.</td>
</tr>
</tbody>
</table>
Outputs are meant to be used to interact with the solution.  In this article, we’ll only use the SQL Database to monitor table updates.
<h2>Micro Service</h2>
The first thing we notice is that there are 13 resources deployed.

This might seem a lot for something that is clearly only a part of a solution.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image7.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb7.png" alt="image" border="0" /></a>

4 of those resources (those framed in red) are only there for demo purposes.  Those resources wouldn’t be deployed in a production environment.  Also, SQL server and DB (in orange) presumably would be pre-exist the streaming solution.

This means the streaming solution really contain eight (8) services.  We would recommend framing those services as a separate resource group.  We would consider the streaming solution as a Micro Service:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image8.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb8.png" alt="image" border="0" /></a>

The micro service boundaries would have 2 inputs:  the telemetry event hub connection.  It would also have an output:  the summary event hub connection.

<span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;">The solution around it shouldn’t interact with the details of the micro service.  It hence make sense to package and treat </span>the sub-solution as a micro service.
<h2>Event Hubs</h2>
Let’s look at the event hubs.

There are three hubs:
<ul>
 	<li>Primary telemetry</li>
 	<li>Secondary telemetry</li>
 	<li>Primary summary</li>
</ul>
The first two are part of the same namespace.  Let’s start with that one.  This is the namespace suffixed by “-primary”:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb9.png" alt="image" border="0" /></a>

Let’s first look at the <em>Shared access policies</em> of the namespace.  Only the default root admin one is available.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb10.png" alt="image" border="0" /></a>

We define access at the hub level as opposed to namespace level.  We do not share the root admin key.  Access is granular, i.e. send or listen, at the event hub level.  This follows the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege">principle of least privilege</a>.

Now, let’s look at the event hubs

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb11.png" alt="image" border="0" /></a>

Lets look at the telemetry hub.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb12.png" alt="image" border="0" /></a>

We can see the capture has been configured.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image13.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb13.png" alt="image" border="0" /></a>

We see that we defined a different policy for send and listen action.  This way if a key is compromised, the damage that can be done is limited.

It is also interesting to notice that the ARM template doesn’t explicitly define the keys.  It simply defines the policy:

[code language="JavaScript"]

{
  &quot;type&quot;: &quot;authorizationRules&quot;,
  &quot;apiVersion&quot;: &quot;2017-04-01&quot;,
  &quot;name&quot;: &quot;listenTelemetryRule&quot;,
  &quot;dependsOn&quot;: [
    &quot;[variables('Primary Telemetry Hub Id')]&quot;
  ],
  &quot;properties&quot;: {
    &quot;rights&quot;: [
      &quot;Listen&quot;
    ]
  }
}

[/code]

and when the key is needed, the following syntax is used:

[code language="JavaScript"]

listKeys(variables('Primary Telemetry Listen Rule Id'), '2017-04-01').primaryKey

[/code]

This has a definite security advantage.  ARM templates are typically stored in widely available internal source control.  Here the keys aren’t available in the template.  We therefore avoid storing secret.

Similar observations can be made for the secondary namespace.

The secondary namespace is deployed in the same region as the primary namespace.  This is done to simplify the number of parameters to the template.  It is trivial to modify the template to deploy it to a secondary region.
<h2>Stream Analytics</h2>
Let’s look at the stream analytics job:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb14.png" alt="image" border="0" /></a>

The meat of the configuration is in the middle of the overview pane:<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image15.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb15.png" alt="image" border="0" /></a>

We see that we have 2 inputs and 1 output.  The query on the right transforms the 2 inputs and feeds the output.

Let’s look at the <em>primary-telemetry</em> configuration:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image16.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb16.png" alt="image" border="0" /></a>

The input is bound to the primary namespace / telemetry event hub.

The other input and the output is similarly configured.  Something specific about the output is that we specify the format:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image17.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb17.png" alt="image" border="0" /></a>

Here we choose <em>array</em>, as opposed to <em>line separated</em>.  Basically array formats the output as a normal JSON array.  Line separated simply output events as JSON document with a line separator.  We found it easier to process a legal JSON array.

The query is interesting:

[code language="SQL"]

SELECT
COUNT(*) AS Count,
widgetId
FROM [primary-telemetry]
TIMESTAMP BY createdAt
GROUP BY widgetId, TumblingWindow(second, 5)
UNION
SELECT
COUNT(*) AS Count,
widgetId
FROM [secondary-telemetry]
TIMESTAMP BY createdAt
GROUP BY widgetId, TumblingWindow(second, 5)

[/code]

We use the input / output aliases in the query.

Here we do a union of the primary and secondary telemetry hub using the <a href="https://msdn.microsoft.com/en-ca/azure/stream-analytics/reference/union-azure-stream-analytics">UNION operation</a>.  Similarly to what UNION does in T-SQL, UNION here simply append events from one source and the other.

Specific the stream analytics is <a href="https://msdn.microsoft.com/en-ca/azure/stream-analytics/reference/windowing-azure-stream-analytics">windowing functions</a>.  In our case, we use the <a href="https://msdn.microsoft.com/en-ca/azure/stream-analytics/reference/tumbling-window-azure-stream-analytics">Tumbling Window</a>.  This window groups events in non-overlapping fashion.  The length of the window here is 5 seconds.  This is actually configured in the <em>Tumbling Window Length in Seconds</em> variable.

<a href="https://docs.microsoft.com/en-ca/azure/stream-analytics/stream-analytics-tools-for-visual-studio">Azure Stream Analytics tools for Visual Studio</a> can assist in stream analytics job authoring.
<h2>Update Summary Logic App</h2>
Let’s look at the logic app that consumes summary events and update the database.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image18.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb18.png" alt="image" border="0" /></a>

The Logic App is quite straightforward.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image19.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb19.png" alt="image" border="0" /></a>

The app triggers on event hub having events.  It then calls a stored procedure.

The trigger full configuration can be seen here:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image20.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb20.png" alt="image" border="0" /></a>

We take maximum 50 events in.  This is done not to overload the database while still batching.

We probe every 2 seconds.  This is actually configured by the <em>Update Summary Probe in Seconds </em>variable.  We recommend setting it up at half the <em>Tumbling Window Length in Seconds</em> variable.  Basically, we want to probe often enough to catch summary events early.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image21.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb21.png" alt="image" border="0" /></a>

The stored procedure action is configured to call <em>[dbo].[updateSummaries].</em>  It passes the content retrieved in the trigger in the <em>jsonPayload</em> parameter.

Both the trigger and the action relies on connections.  For instance, the SQL connection:

[code language="JavaScript"]

{
  &quot;type&quot;: &quot;microsoft.web/connections&quot;,
  &quot;apiVersion&quot;: &quot;2016-06-01&quot;,
  &quot;name&quot;: &quot;sqlConnection&quot;,
  &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
  &quot;dependsOn&quot;: [
    &quot;[resourceId('Microsoft.Sql/servers/databases', variables('SQL Server Name'), variables('SQL DB Name'))]&quot;
  ],
  &quot;properties&quot;: {
    &quot;api&quot;: {
      &quot;id&quot;: &quot;[concat(subscription().id, '/providers/Microsoft.Web/locations/', resourceGroup().location, '/managedApis/', 'sql')]&quot;
    },
    &quot;displayName&quot;: &quot;SQL Connection&quot;,
    &quot;parameterValues&quot;: {
      &quot;server&quot;: &quot;[variables('SQL Server FQDN')]&quot;,
      &quot;database&quot;: &quot;[variables('SQL DB Name')]&quot;,
      &quot;username&quot;: &quot;[variables('SQL Admin Name')]&quot;,
      &quot;password&quot;: &quot;[parameters('SQL Admin Password')]&quot;
    }
  }
}

[/code]

Connections are Azure resources.  They externalize connection configuration.  We have covered in another article <a href="https://vincentlauzon.com/2017/10/28/how-to-create-a-logic-app-connector-in-an-arm-template/">how to create them in an ARM Template</a>.
<h2>Database</h2>
The database consist of two items:  a summary table and a stored procedure.  <a href="https://github.com/vplauzon/streaming/blob/master/SummaryStreaming/Deployment/db-script.sql">The script to create them</a> is executed by an <a href="https://vincentlauzon.com/2018/04/26/azure-container-instance-getting-started/">Azure Container Instance</a>.

[code language="SQL"]

--DROP PROC dbo.updateSummaries
--DROP TABLE [dbo].WidgetSummary

CREATE TABLE [dbo].WidgetSummary
(
[WidgetId] INT NOT NULL PRIMARY KEY,
[WidgetCount] INT NOT NULL
)
GO

CREATE PROC dbo.updateSummaries @jsonPayload AS VARCHAR(MAX)
AS
BEGIN
MERGE dbo.WidgetSummary AS target
USING
( -- We can't merge with repeating ids
-- This can happend in case of failure / restart
SELECT WidgetId, SUM(WidgetCount) AS WidgetCount
FROM
(
SELECT *
FROM OPENJSON(@jsonPayload)
WITH (
WidgetId INT '$.widgetid',
WidgetCount INT '$.count'
)
) AS t
GROUP BY WidgetId
) AS source
ON (target.WidgetId = source.WidgetId)
WHEN MATCHED THEN
UPDATE SET WidgetCount = source.WidgetCount+target.WidgetCount
WHEN NOT MATCHED THEN
INSERT (WidgetId, WidgetCount)
VALUES (source.WidgetId, source.WidgetCount);
END
GO

[/code]

The table has two fields:  a widget ID and the count.  The count will reflect how many telemetry events with the given widget ID have been observed.

We can connect to the database using our favorite tool.  We are going to use Visual Studio and run the following query:

[code language="SQL"]

SELECT * FROM [dbo].WidgetSummary
SELECT SUM(widgetCount) FROM [dbo].WidgetSummary

[/code]

We should have the following output:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image22.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb22.png" alt="image" border="0" /></a>

Since the database is initially empty.
<h2>Simulate a source</h2>
The ARM template we deploy contains a second logic app.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image23.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb23.png" alt="image" border="0" /></a>

That app bombards both the primary and secondary telemetry with telemetry events.  It sends 10000 events by default.  That number is controlled by the <em>Simulation Burst Count</em> variable.

Events contain randomized widget id.  The range of ids vary from 1 to 500.  That number is controlled by the <em>Simulation Widget Range</em> variable.

We can start the logic app by clicking <em>Run Trigger</em> then <em>manual</em>.  “Manual” is the name of the trigger inside this Logic App.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image24.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb24.png" alt="image" border="0" /></a>

Let's run the SQL queries we defined in the previous section.  We should start seeing the events coming in quickly.  We’ll notice that at about every 5 seconds a batch of events is processed.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image25.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb25.png" alt="image" border="0" /></a>

The 10000 events should take about 5 minutes to complete.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image26.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb26.png" alt="image" border="0" /></a>

If there are no failure in the pipeline we should end up with exactly 10000 events in the count query.
<h2>Simulate a Stream Analytics failure</h2>
Let’s run the simulation logic app again.  Let’s have some events coming in for a minute or so.

Let’s stop the Stream Analytics job.  This will simulate a failure.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image27.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb27.png" alt="image" border="0" /></a>

It takes a little while for the job to stop.

After a short while we should see no movement in the database.

Let’s restart the job.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image28.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb28.png" alt="image" border="0" /></a>

Let’s specify we want to start back when we last stopped:

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image29.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb29.png" alt="image" border="0" /></a>

It takes a little while to restart.  We should then see database movement again.

We would expect to land at 20000.  Typically we land a little further.

<a href="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image30.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/5/implementing-automating-azure-stream-analytics-pipeline/image_thumb30.png" alt="image" border="0" /></a>

This is due to the job reprocessing some events.  Avoiding this isn’t trivial and we won’t cover it in this article.
<h2>Summary</h2>
<span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;">We've looked at how to implement an Azure Stream Analytics pipeline.</span>

We’ve done a tour of how to configure different services.

Each service is quite simple to configure.  By assembling multiple service in a chain we create a powerful pipeline.

We’ve also provided the <a href="https://github.com/vplauzon/streaming/tree/master/SummaryStreaming">ARM template deploying the entire solution</a>.  This allows us to achieve consistency between environments and to deploy on demand.