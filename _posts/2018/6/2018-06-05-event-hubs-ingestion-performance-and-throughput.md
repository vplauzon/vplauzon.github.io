---
title:  Event Hubs ingestion performance and throughput
date:  2018-06-05 06:30:10 -04:00
permalink:  "/2018/06/05/event-hubs-ingestion-performance-and-throughput/"
categories:
- Solution
tags:
- Data
- Streaming
---
<a href="http://vincentlauzon.files.wordpress.com/2018/06/metal-pipes-plumbing-372796.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="metal-pipes-plumbing-372796" src="http://vincentlauzon.files.wordpress.com/2018/06/metal-pipes-plumbing-372796_thumb.jpg" alt="metal-pipes-plumbing-372796" width="320" height="240" align="left" border="0" /></a><a href="https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-what-is-event-hubs">Azure Event Hubs</a> is a data streaming platform as a Service.  It is an ingestion service.

We’ve looked at Event Hubs as the ingestion end of <a href="https://docs.microsoft.com/en-us/azure/stream-analytics/stream-analytics-introduction">Azure Stream Analytics</a> in two recent articles (<a href="https://vincentlauzon.com/2018/05/22/taming-the-fire-hose-azure-stream-analytics/">here</a> &amp; <a href="https://vincentlauzon.com/2018/05/31/implementing-automating-azure-stream-analytics-pipeline/">here</a>).

Here we look at client side performance of different techniques and scenarios.  For instance, we’ll consider both AMQP &amp; HTTP protocols.

By measuring the outcome of those scenarios &amp; techniques, we can then make recommendations.
<h2>Recommendations</h2>
Here are some recommendations in the light of the performance and throughput results:
<ul>
 	<li>If we send <strong>many events</strong>:  always reuse connections, i.e. do not create a connection only for one event.  This is valid for both AMQP and HTTP.  A simple <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/EventHubClientPool.cs">Connection Pool pattern</a> makes this easy.</li>
 	<li>If we send <strong>many events</strong> &amp; <strong>throughput</strong> is a concern:  use AMQP.</li>
 	<li>If we send <strong>few events</strong> and <strong>latency</strong> is a concern:  use HTTP / REST.</li>
 	<li>If events naturally comes in <strong>batch of many events</strong>:  use batch API.</li>
 	<li>If events <strong>do not</strong> naturally comes in <strong>batch of many events</strong>:  simply stream events.  <strong>Do not try</strong> to batch them unless network IO is constrained.</li>
 	<li>If a <strong>latency </strong>of <strong>0.1 seconds</strong> is a concern:  move the call to Event Hubs away from your critical performance path.</li>
</ul>
Let’s now look at the tests we did to come up with those recommendations.
<h2>How to run tests ourselves</h2>
<a href="http://vincentlauzon.files.wordpress.com/2018/06/daylight-gray-hand-994164.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="daylight-gray-hand-994164" src="http://vincentlauzon.files.wordpress.com/2018/06/daylight-gray-hand-994164_thumb.jpg" alt="daylight-gray-hand-994164" width="320" height="320" align="right" border="0" /></a>We performed tests which are repeatable.

The <a href="https://github.com/vplauzon/streaming/tree/master/ClientPerf">code is in GitHub</a> and can be deployed by the click of the following button:

<img style="max-width:100%;" src="https://camo.githubusercontent.com/9285dd3998997a0835869065bb15e5d500475034/687474703a2f2f617a7572656465706c6f792e6e65742f6465706c6f79627574746f6e2e706e67" />

This deploys an Event Hub namespace with many <a href="https://vincentlauzon.com/2018/04/26/azure-container-instance-getting-started/">Azure Container Instances</a>.  Container instances are the clients performing different scenarios.

The Event Hub namespace is set to maximum capacity (20).  This is to remove constraints on the service side.  This can be expensive in the long run, so we recommend to lower it after the test have run.

Each Container Instance has 1 CPU and 1 Gb of RAM.

The throughput test stresses the capacity of the Event Hub.  For that reason the containers are configured to run in sequence instead of in parallel.

The container instances all run the same container image.  That image is available of <a href="https://hub.docker.com/r/vplauzon/client-perf-event-hub/">Docker Hub here</a>.  The code for the <a href="https://github.com/vplauzon/streaming/tree/master/ClientPerf/ClientConsole">image executable also is on GitHub</a> as well as its <a href="https://github.com/vplauzon/streaming/tree/master/ClientPerf/test-docker">docker file and artefacts</a>.

The code uses environment variable to run different scenarios.  The <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/ScenarioBase.cs">ScenarioBase</a> class represents a scenario and derived classes implement different scenarios.
<h2>Performance</h2>
<a href="http://vincentlauzon.files.wordpress.com/2018/06/automobile-fast-number-248747.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="automobile-fast-number-248747" src="http://vincentlauzon.files.wordpress.com/2018/06/automobile-fast-number-248747_thumb.jpg" alt="automobile-fast-number-248747" width="320" height="264" align="right" border="0" /></a>Let’s start with the performance scenarios.

Here we are interested in how fast it takes to send one or many messages.  We are not concerned about throughput but on latency.

We looked at three scenarios:
<ol>
 	<li>Isolated:  here we create a brand new Event Hub connection, send an event and close the connection.</li>
 	<li>Batch (1 by 1):  here we send many events, one by one, using that same connection.</li>
 	<li>Batch:  here we send a batch of events at once.</li>
</ol>
For the two batch scenarios we used batch of 50 events.

We did that both for AMQP &amp; HTTP REST API.  The AMQP API is implemented by <a href="https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.eventhubs?view=azure-dotnet">Event Hub SDK</a> (also <a href="https://docs.microsoft.com/en-us/java/api/com.microsoft.azure.eventhubs">available in Java</a>).  HTTP isn’t.  We implemented it following the specs of both <a href="https://docs.microsoft.com/en-us/rest/api/eventhub/send-event">single-event</a> and <a href="https://docs.microsoft.com/en-us/rest/api/eventhub/send-batch-events">batch specs</a>.  The implementation is done in <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/HttpEventHubClient.cs">HttpEventHubClient class</a>.  We used the <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/IEventHubClient.cs">IEventHubClient interface</a> abstraction to simplify testing both AMQP &amp; REST.

We always send the same event payload.  The payload is small:  &lt; 1kb in JSON.  In C#:

[code language="csharp"]


new
{
    Name = &quot;John Smith&quot;,
    Age = 42,
    Address = new
    {
        Street = &quot;Baker&quot;,
        StreetNumber = &quot;221B&quot;
    },
    Skills = new[]
    {
        &quot;Engineer&quot;,
        &quot;Flight&quot;,
        &quot;Programming&quot;,
        &quot;Talking&quot;
    },
    CreatedAt = DateTime.UtcNow.ToString(&quot;o&quot;)
};

[/code]

The corresponding container instances for those scenarios are:
<ul>
 	<li>isolated-perf-amqp-group</li>
 	<li>isolated-perf-http-group</li>
 	<li>batch-one-by-one-perf-amqp-group</li>
 	<li>batch-one-by-one-perf-http-group</li>
 	<li>batch-perf-amqp-group</li>
 	<li>batch-perf-http-group</li>
</ul>
To look at the result, we can simply select an Azure Container Instance group:

<a href="http://vincentlauzon.files.wordpress.com/2018/06/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/06/image_thumb.png" alt="image" border="0" /></a>

Then select the containers of that group.

<a href="http://vincentlauzon.files.wordpress.com/2018/06/image1.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/06/image_thumb1.png" alt="image" border="0" /></a>

There is only one for each group.  We can select the <em>logs</em> tab.  This shows us the console output.

At the top of the logs we see the environment variables that were passed to the container.  We can also see those in the <em>properties</em> tab.

<a href="http://vincentlauzon.files.wordpress.com/2018/06/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://vincentlauzon.files.wordpress.com/2018/06/image_thumb3.png" alt="image" border="0" /></a>
<h2>Performance Results</h2>
Here is a summary of the results.
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th></th>
<th>AMQP (in seconds)</th>
<th>HTTP / REST (in seconds)</th>
</tr>
</thead>
<tbody>
<tr>
<td>Isolated (first)</td>
<td>1.55</td>
<td>0.29</td>
</tr>
<tr>
<td>Isolated (sustained)</td>
<td>0.24</td>
<td>0.10</td>
</tr>
<tr>
<td>Batch (one by one) for 50 events</td>
<td>1.76 (0.035 per event)</td>
<td>1.20 (0.024 per event)</td>
</tr>
<tr>
<td>Batch</td>
<td>0.26 (0.005 per event)</td>
<td>0.12 (0.002 per event)</td>
</tr>
</tbody>
</table>
We split the first scenario in two.  We can see that the first event a process runs pays an overhead tax.  We didn’t dive in for details.  It is likely Just In Time (JIT) compilation is happening.  Maybe some internal objects are initialized once.  The second row shows the average of time excluding the first event.

<a href="/assets/2018/6/event-hubs-ingestion-performance-and-throughput/perfchart.png"><img class="alignnone size-full wp-image-5123" src="/assets/2018/6/event-hubs-ingestion-performance-and-throughput/perfchart.png" alt="" width="480" height="289" /></a>

A few observations:
<ul>
 	<li>HTTP is faster than AMQP (simpler protocol)</li>
 	<li>Using a new connection for each event is an order of magnitude slower</li>
 	<li>Using the batch API is an order of magnitude faster</li>
</ul>
We’ll look at the recommendations after we look at the throughput tests.
<h2>Throughput</h2>
<a href="http://vincentlauzon.files.wordpress.com/2018/06/black-and-white-busy-cameras-735795.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="black-and-white-busy-cameras-735795" src="http://vincentlauzon.files.wordpress.com/2018/06/black-and-white-busy-cameras-735795_thumb.jpg" alt="black-and-white-busy-cameras-735795" width="320" height="197" align="left" border="0" /></a>Let’s look at throughput.

Speed and throughput are sometimes confused.  They are related.  For instance, a very slow service won’t be able to achieve high throughput.

Throughput measures the number of events we can send to event hub per second.  This will dictate our ability to scale our solutions based on Event Hubs.

We did look at four (4) scenarios for throughput:
<ol>
 	<li>Isolated:  again we open a new connection, send one event and close the connection.</li>
 	<li>Isolated with pooling:  here we use a connection pool so that we do not create a new connection for each event.  We do not use a singleton connection single we are multithreaded.</li>
 	<li>Safe Batch Buffer:  here we buffer events together to send them in batch.  We do that in a “safe way” in the sense that we do not returned until the event has been sent as part of an event.</li>
 	<li>Unsafe Batch Buffer:  similar to safe batch buffer.  Here we return immediately and send events in batch shortly after.  Under certain circumstances we could lose events without caller knowing about it.  Hence the <em>unsafe</em> in the scenario’s name.</li>
</ol>
We used 100 threads sending events.  We sampled for 2 minutes.  For the two buffer batch scenarios, we cap the batch size at 50 events.

We implemented a very basic connection pooling class in <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/EventHubClientPool.cs">EventHubConnectionPool</a>.  We use it for pooling scenario.

The batch buffer scenarios implements a more sophisticated algorithm.  The main idea is that when we push an event, we wait a short while (0.1 second) before actually sending it.  During that time, other events are accumulated and sent in one batch.  The trade off is that the more we wait the bigger batches we sent but higher the latency will be.  This algorithm is implemented in a safe manner in <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/SafeBufferBatchEventHubClient.cs">SafeBufferBatchEventHubClient</a> and in the unsafe manner in <a href="https://github.com/vplauzon/streaming/blob/master/ClientPerf/ClientConsole/UnsafeBufferBatchEventHubClient.cs">UnsafeBufferBatchEventHubClient</a>.

Corresponding container instances for those scenarios are:
<ul><!--StartFragment-->
 	<li>isolated-throughput-amqp-group</li>
 	<li>isolated-throughput-http-group</li>
 	<li>isolated-pool-throughput-amqp-group</li>
 	<li>isolated-pool-throughput-http-group</li>
 	<li>safe-batch-buffer-throughput-amqp-group</li>
 	<li>safe-batch-buffer-throughput-http-group</li>
 	<li>unsafe-batch-buffer-throughput-amqp-group</li>
</ul>
<ul><!--StartFragment-->
 	<li>unsafe-batch-buffer-throughput-http-group</li>
</ul>
<h2>Throughput Results</h2>
Here is a summary of results.
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th></th>
<th>AMQP (# events / second)</th>
<th>HTTP / REST (# events / second)</th>
</tr>
</thead>
<tbody>
<tr>
<td>Isolated</td>
<td>N / A</td>
<td>67</td>
</tr>
<tr>
<td>Isolated with pool</td>
<td>3311</td>
<td>420</td>
</tr>
<tr>
<td>Safe Batch Buffer</td>
<td>809</td>
<td>854</td>
</tr>
<tr>
<td>Unsafe Batch Buffer</td>
<td>7044</td>
<td>7988</td>
</tr>
</tbody>
</table>
The isolated scenario in AMQP actually fails with connection timeout.  We didn’t bother exploring why.  It likely is in the same order of magnitude as its HTTP peer, which is the worst in the table.

<a href="/assets/2018/6/event-hubs-ingestion-performance-and-throughput/throughputchart.png"><img class="alignnone size-full wp-image-5124" src="/assets/2018/6/event-hubs-ingestion-performance-and-throughput/throughputchart.png" alt="" width="480" height="289" /></a>

AMQP protocol shines in a streaming scenario.  When we reuse connections and keep sending events, i.e. scenario <em>Isolated with pool</em>.  It out performs HTTP / REST by an order of magnitude.

Batching is obviously efficient if we look at the <em>Unsafe Batch Buffer</em> scenario.  It isn’t trivial to implement in a “safe” manner with random events.  We need to wait for events to come in and then they all need to wait for interaction with Event Hubs.  It therefore makes sense to use the batch API when events naturally comes in batch within the application.  Trying to batch them <em>a posteriori </em>yields worse throughput than sending them one by one.

We also got cues during the testing that batching was much more efficient in terms of resources.  It makes sense as there are much less networking overhead.
<h2><!--EndFragment--><!--EndFragment-->Summary</h2>
We looked at performance and throughput of different usage patterns of Event Hubs.  This was done from the client perspective to push events to Event Hubs.

Obviously, achieving a certain throughput level requires capacity on the Event Hubs namespace.  Capacity dictates the amount of Mb/s we can push to the hub before getting throttled.  This <a href="https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-metrics-azure-monitor">can easily get monitored</a>.

<em><!--EndFragment--></em>