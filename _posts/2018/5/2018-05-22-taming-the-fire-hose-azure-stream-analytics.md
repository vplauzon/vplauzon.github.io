---
title:  Taming the fire hose: Azure Stream Analytics
date:  2018-05-22 06:30:51 -04:00
permalink:  "/2018/05/22/taming-the-fire-hose-azure-stream-analytics/"
categories:
- Solution
tags:
- Data
- Integration
- Serverless
- Streaming
---
<a href="http://vincentlauzon.files.wordpress.com/2018/05/accident-action-adult-2800761.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="accident-action-adult-280076" src="http://vincentlauzon.files.wordpress.com/2018/05/accident-action-adult-280076_thumb1.jpg" alt="accident-action-adult-280076" width="320" height="167" align="left" border="0" /></a>We came upon an interesting challenge recently.

Let’s have a stream of events pouring in.  The source is unimportant.  Hundreds, peeking at thousands, of events per second.

We need to update a table in Azure SQL with a summary of the events.

Let’s just assume the events are about widgets.  So each event contain a widget id.

[code language="JavaScript"]

{

  &quot;widgetId&quot; : 42

}

[/code]

Let’s assume the summary table is the list of widget ids and the number of time they each appeared in the event streams.

We’ll build an architecture to do this resilience.  The final solution will leverage <a href="https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-introduction">Azure Stream Analytics</a> (ASA).

ASA is a service getting too little press cover given its capacities.  It’s a great integration service, very simple to configure and very powerful.  A colleague of mine, the venerable <a href="https://www.linkedin.com/in/krishnavenk/detail/recent-activity/posts/">Krishna Venkataraman</a>, wrote <a href="https://www.amazon.com/Stream-Analytics-Microsoft-Azure-processing/dp/1788395905/">an entire book about it</a>.  I recommend the book in a shameless plug here.
<h2>Whiteboarding</h2>
Let’s start with a naïve architecture and iterate around it.
<h3>Naïve approach</h3>
<a href="http://vincentlauzon.files.wordpress.com/2018/05/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb.png" alt="image" border="0" /></a>

Let’s have an API ingesting events and updating the summary table in SQL database.  This is going to be our baseline solution.

Here we position Azure Function for the API.  But it could be any technologies (App Service, Container, VMs, etc.).

Does this solution fly?

Not with the scale we mention.

We can’t update a SQL DB hundreds of times a second.  We would also run into trouble as we scale out the API.  When multiple API instances try to update the same record in a table, they’ll hit concurrency errors.

We could buffer events at the API level.  We could turn to SQL every 5 seconds only.  This gets the complexity of API implementation higher.

It also puts pressure on the underlying infrastructure.  Since the events are kept in RAM, events could be lost in case of failure.

Another issue is that we would need to implement an API that can scale to thousands of calls a second.  Those calls would need to have little latency not to slow down the source.  We would need to drastically trim down the implementation.  Event then, we would likely need to scale out, which adds costs to the solution.

Finally, if Azure SQL DB goes down for a while, the API is stuck accumulating the events or discarding them.
<h3>Introducing Event Hubs and Stream Analytics</h3>
We need to add resiliency to our solution.  Queuing is an obvious avenue.

<a href="http://vincentlauzon.files.wordpress.com/2018/05/image1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb1.png" alt="image" border="0" /></a>

Here we introduced a couple of components.  Telemetry is now sent to an <a href="https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-what-is-event-hubs">Event Hub</a>.  Event Hub is an ingestion service.  It can ingest millions of events per second.  Those events are reliably stored so it doesn’t drop events.

Event Hubs can keep events around for up to seven days.  It isn’t a permanent store.  It allows to capture the events to blob storage natively though.  We use this here.  This is a typical <a href="https://en.wikipedia.org/wiki/Lambda_architecture">lambda architecture</a> with blob storage being on the cold path / batch layer.  We can later go back to that storage to do some (big) data analysis on it.

Next we get <a href="https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-introduction">Azure Stream Analytics</a> (ASA).  ASA is a stream processing engine.  It takes a stream of events and transform it into…  another stream of events.  It can implement <a href="https://en.wikipedia.org/wiki/Complex_event_processing">Complex Event Processing</a>.  Here we use it for a much more mundane tasks.  It aggregates events and emits summary events (aggregates).

<a href="http://vincentlauzon.files.wordpress.com/2018/05/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb2.png" alt="image" border="0" /></a>

The key is that ASA absorbs the fire hose of events.  It takes hundreds of events a second and output a few events per minute.  That makes it tractable problem in terms of events / seconds.  It allows us to scale.

It is important to note that ASA does all that with resilience to failure.  If the service goes down, it won’t drop events.  It will start back where it stopped.

[code language="SQL"]

SELECT
COUNT(*) AS Count,
WidgetId
INTO
[function]
FROM
[fast] TIMESTAMP BY CreatedAt
GROUP BY
WidgetId,
TumblingWindow(second, 5)

[/code]

We use a <a href="https://msdn.microsoft.com/azure/stream-analytics/reference/tumbling-window-azure-stream-analytics?f=255&amp;MSPPError=-2147217396">tumbling window</a> to compute our aggregates (see <a href="https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-window-functions">all types of windowing function</a>).  It is important to note that events need to have a timestamp field so ASA can filter on those.  That <a href="https://msdn.microsoft.com/en-ca/azure/stream-analytics/reference/timestamp-by-azure-stream-analytics?f=255&amp;MSPPError=-2147217396">field needs to be ISO 8601</a>.  In C#, that is achieved by

[code language="csharp"]

DateTime.UtcNow.ToString(&quot;o&quot;)

[/code]

ASA supports Azure Function as a native output.  The events are pumped towards a function directly.  Each event will be of the form

[code language="JavaScript"]

{“WidgetId”:42, “Count”:25}

[/code]

ASA allows to batch many events to functions.  The function could then call a stored procedure processing a batch of JSON.

Now, how does that solution look like?

Although we added components, each component has very simple role.  So complexity hasn’t gone up too much.  The API implementation is now a trivial stored procedure call.

Throughput no longer is an issue.

We have resilience built in.  If ASA falls, it won’t lose events.

We still have some reliability issues though.

Have an Azure Function receiving the events has some risks.

If Azure SQL DB goes down, the Function is stuck with its events.  It can implement retries.  If the Azure Function infrastructure goes down during those retries, we’ll lose the event.  Let’s say there is a SQL outage of an hour, that puts a lot of pressure on the function to stay up.  Function instances would accumulate during the SQL outage.  Once the database is back online, those function instances would likely overwhelm it.  We would need backing off logic on top of retries.

Writing a function resilient to its own logic error is hard.  <a href="https://hackernoon.com/reliable-event-processing-in-azure-functions-37054dc2d0fc">Jeff Hollan wrote an excellent article</a> about how to do this.  The challenge is that if the function fails by itself, i.e. throws an exception, the events aren’t replayed.  We lose the events.  A resilient function should have try-catch with retry policies.

That puts a lot of complexity inside a black box.  There are better and easier ways to do that.
<h3>Introducing Logic Apps</h3>
In this iteration we replace the Azure Function with a <a href="https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview">Logic App</a>.

<a href="http://vincentlauzon.files.wordpress.com/2018/05/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb3.png" alt="image" border="0" /></a>

We <a href="https://vincentlauzon.com/2017/10/19/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/">discussed Logic Apps before</a>.  Logic Apps is a workflow-based integration service.  It orchestrates tasks between different services.  It has resilient retry policies built in.  It is also quite trivial to call a SQL Stored Procedure from a Logic App.

Positioning Logic App allows us to get a reliable event delivery service to our SQL Db.  If SQL goes down, Logic App will retry with exponential back off.  If Logic App goes down, it will start back where it left:  it persists its state between each step.

Logic Apps is much slower though given all this persistence logic.  If we wanted it to execute every 5 seconds, we would advise to test it.  But if we are looking at an execution every minute or so, we’re good.

Unfortunately, ASA doesn’t support Logic Apps as an output.  Logic Apps can be triggered by events in an Event Hub though.  For that reason we add another Event Hub as output to ASA and input to Logic Apps.

Are we done yet?

We’ve looked at a few failure scenarios.  Let’s look at the SLAs:

<a href="http://vincentlauzon.files.wordpress.com/2018/05/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb4.png" alt="image" border="0" /></a>

In Cloud Architecture, every component can, and eventually will, fail.  We need to take that into account.

We built a lot of resilience in this architecture.  If anything fails after the telemetry event hub, it will start back where it was before failure.

Our most exposed failure point is the Telemetry Event Hub, i.e. the one taking the source events.  <a href="https://azure.microsoft.com/en-us/support/legal/sla/event-hubs/v1_0/">Event Hub has an SLA of %99.9</a>.  We discussed <a href="https://vincentlauzon.com/2018/01/22/solution-slas-in-azure/">Azure SLAs at length</a> so we won’t reproduce that discussion here.

Azure target uptime is %100.  That is there is no planned downtime for HA services such as Event Hub.  Nevertheless hic ups happen and %99.9 is the financially backed SLA.  So let’s assume this is the expected uptime value.  %99.9 corresponds to about <a href="https://uptime.is/">45 minutes of monthly downtime</a>.  This means we would drop that much events in a month.

If that drop happens during peak periods, at say 1000 events / s, it would mean over 2 million events would be lost.

If that lost isn’t acceptable, we should consider boosting the availability of our front door event hub.

<a href="http://vincentlauzon.files.wordpress.com/2018/05/image5.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/05/image_thumb5.png" alt="image" border="0" /></a>

The classical technique is to have a secondary event hub in a secondary region.  Each region is operated independently.  They therefore fail independently.  We need the cooperation of the source for that.  We need to source of events to send the events to the primary hub.  In case of failure, and only in case of failure, we need it to fall back to the secondary hub.

In terms of probability, for a failure to occur at the telemetry hub layer, both hubs would need to fail.  As we have shown in our article on SLA for blob storage, which also have %99.9 SLA, this leads to a compound uptime expectation of %99.9999.

%99.9999 uptime means <a href="https://uptime.is/99.9999">2.6 seconds of downtime monthly</a>.  This leads to marginal event lost.

This solution is slightly more complex on the source side.  It might actually be impossible if we don’t control the source.
<h2>Summary</h2>
We’ve looked at an hard problem:  <em>how to compute summaries on a fast stream of events in a reliable way</em>?

We started with a naïve solution.  We then added components gradually to take care of different aspects.

The first solution was simple but didn’t really work.  The last solution might seem complex to some readers.  It contains seven (7) Azure services.  Each service is performing a very simple task though.

The difference is akin to a monolithic versus micro service solution.  A micro service solution has a lot of simple services.  The monolithic solution might look simpler.  But it contains a lot of complex logic in opaque ways.

The last solution brings the elements of the solution at the architecture instead of burying them in the implementation (code).

As with micro service, the most resilient solution puts pressure on dev ops processes.  More services require more complex deployments.