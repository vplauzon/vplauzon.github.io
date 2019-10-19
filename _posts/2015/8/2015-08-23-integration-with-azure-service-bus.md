---
title:  Integration with Azure Service Bus
date:  2015-08-23 19:00:25 -04:00
permalink:  "/2015/08/23/integration-with-azure-service-bus/"
categories:
- Solution
tags:
- Integration
---
<a href="assets/2015/8/integration-with-azure-service-bus/message1.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="message[1]" src="assets/2015/8/integration-with-azure-service-bus/message1_thumb.png" alt="message[1]" width="200" height="125" align="left" border="0" /></a>

I've been consulting 1.5 years for a customer embarking a journey leveraging Microsoft Azure as an Enterprise platform, helping them rethink their application park.

Characteristic of that customer:
<ul>
	<li>Lots of Software as a Service (Saas) third parties</li>
	<li>Business is extremely dynamic, in terms of requirements, transitions, partnerships, restructuring, etc.</li>
	<li>Medium operational budget:  they needed to get it pretty much right the first time</li>
	<li>Little transaction volume</li>
</ul>
One of the first thing we did was to think about the way different systems would integrate together given the different constraints of the IT landscape of the organization.

We settled on use <a href="http://azure.microsoft.com/en-us/services/service-bus/" target="_blank">Azure Service Bus</a> to do a lot of the integrations.  Since then, I worked to help them actually implement that in their applications all the way to the details of operationalization.

Here I wanted to give my lessons learned on what worked well and what didn’t.  Hopefully, this would prove useful to others out there set out to do similar integration program.
<h3>Topics vs Queues</h3>
The first thing we decided was to use <a href="https://azure.microsoft.com/en-us/documentation/articles/service-bus-fundamentals-hybrid-solutions/#topics" target="_blank">Topics &amp; Subscriptions</a> as opposed to <a href="https://azure.microsoft.com/en-us/documentation/articles/service-bus-fundamentals-hybrid-solutions/#queues" target="_blank">queues</a>.  Event Hubs didn’t exist when we started so it wasn’t considered.

They work in similar ways with one key difference:  a topic can have many subscribers.

This ended up being a really good decision.  It costs nearly nothing:  configuring a subscription takes seconds longer than just configuring a queue.  But it bought us the flexibility to add subscribers along the way as we evolved without disrupting existing integrations.

A big plus.
<h3>Meta Data</h3>
<a href="assets/2015/8/integration-with-azure-service-bus/image48.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/integration-with-azure-service-bus/image_thumb48.png" alt="image" width="264" height="264" align="right" border="0" /></a>In order to implement a meaningful publish / subscribe mechanism, you need a way to filter messages.  In Azure Service Bus, subscription filter topic messages on meta data, for instance:
<ul>
	<li>Content Type</li>
	<li>Label</li>
	<li>To</li>
	<li>Custom Properties</li>
</ul>
If you want your integration architecture to have long-term value and what you build today be forward compatible, i.e. you want to avoid rework when implementing new solutions, you need to make it possible for future consumers to filter today's messages.

It's hard to know what future consumers will need but you can try populating the obvious.  Also, make sure your consumers don't mind if new meta data is added along the way.

For instance, you want to be able to publish new type of messages.  A topic might start with having orders published on it but with time you might want to publish price-correction messages.  If a subscription just take everything from the topic, it will swallow the price-correction and potentially blow the consumer.

One thing we standardized was the use of content-type.  A content type would tell what type of message the content is about.  The content-type would actually contain the major version of the message.  This way an old consumer wouldn’t break when we would change a message version.

We used labels to identity the system publishing a message.  This was often useful to stop a publishing loop:  if a system subscribes to a topic where it itself publishes, you don’t want it to consume its own message and potentially re-publish information.  This field would allow us to filter out message this way.

Custom Properties were more business specific and the hardest to guess in advance.  It should probably contain the main attributes contained in the message itself.  For an order message, the product ID, product category ID, etc.  should probably be in it.
<h3>Filtering subscription</h3>
<a href="assets/2015/8/integration-with-azure-service-bus/filter1.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="filter[1]" src="assets/2015/8/integration-with-azure-service-bus/filter1_thumb.png" alt="filter[1]" width="92" height="79" align="left" border="0" /></a>Always filter subscription!  This is the only way to ensure future compatibility.  Make sure you specify what you want to consume.

Also, and I noticed only too late while going into production:  filtering gives you a massive efficiency boost under load.

One of the biggest integration we developed did a lot of filtering on the consumer-side, i.e. the consumer C# code reading messages would discard messages based on criteria that could have been implemented in the filters.  That caused the subscriptions to catch way more messages than they should and take way more time to process.

Filtering is cheap on Azure Service Bus.  It takes minutes more to configure but accelerate your solution.  Use it!
<h3>Message Content</h3>
You better standardize on the format of messages you’re going to carry around.  Is it in XML, JSON, .NET binary serialized?

Again you want your systems to be decoupled so having a standard message format is a must.
<h3>Automatic Routing</h3>
There is a nice feature in Azure Service Bus:  <em>Forward To</em>.  This is a property of a subscription where you specify which topic (or queue) you want every message getting into the subscription to be routed to.

Why would you do that?

Somebody had a very clever idea that turned out to pay lots of dividend down the road.  You see, you may want to replay messages when they fail and eventually fall in the dead letter queue.  The problem with a publish / subscribe model is that when you replay a message, you replay it in the topic and all subscriptions get it.  Now if you have a topic with say 5 subscriptions and only one subscription struggles with a message and you replay it (after, for instance, changing the code of the corresponding consumer), then 4 subscriptions (previously successfully processing the message) will receive it again.

So the clever idea was to forward messages from every subscriptions to other topics where they could be replayed.  Basically we had two ‘types’ of topics, topic to publish messages and topic to consume messages.
<h3>Semantic of Topics</h3>
While you are at it, you probably want to define what your topics represent.

Why not put all messages under one topic?  Well, performance for one thing but probably management at some point.  At the other end of the spectrum, why not one topic per message type?

Order.

Service Bus guaranties order within the same topic, i.e. messages will be presented in the order they were delivered.  That is because you can choose to consume your messages (on your subscription) one by one.  But if messages are in different topics, you’ll consume them in different subscription and the order can be altered.

If order is important for some messages, regroup them under a same topic.

We ended up segmenting topics along enterprise data domains and it worked fine.  It really depends what type of data transits on your bus.
<h3>Multiplexing on Sessions</h3>
<a href="assets/2015/8/integration-with-azure-service-bus/image49.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2015/8/integration-with-azure-service-bus/image_thumb49.png" alt="image" width="281" height="103" align="right" border="0" /></a>A problem we faced early on was due to caring a bit too much about order actually.

We did consume one message at the time.  That could have performance issues but the volume wasn’t big, so that didn't hit us.

The problems started when you encounter a poison message though.  What do you do with it?  If you let it reach the dead letter queue then you’ll process the next message and violate order.  So we did put a huge retry count so this would never happen.

But then that meant blocking the entire subscription until somebody got tired and looked into it.

A suggestion came from Microsoft Azure Bus product team itself.  You can assign a session-ID to message.  Messages with the same session-ID would be grouped together and order properly while messages from different session can be process independently.  Your subscription needs to be session-ful for this to work.

This allowed us to have only one of the session to fail and the other messages to kept being processed.

Now how do you choose your session-ID?  You need to group messages that depend (order-wise) on each other together.  That typically boils down to the identifier of an entity in the message.

This can also speedup message processing since you are no longer bound to one-by-one.

After that failing messages will keep failing but that will only hold on correlated messages.  That is a nice "degraded service level" as opposed to completely failing.
<h3>Verbose Message Content</h3>
One of the thing we changed midway was the message content we passed.  At first we use the bus to really send data, not only events.

There are advantages in doing so:  you really are decoupled since the consumer gets the data with the message and the publishing system doesn’t even need to be up when the consumer process the message.

It has one main disadvantage when you use the bus to synchronize or duplicate data though:  the bus becomes this train of data and any time you disrupt the train (e.g. failing message, replaying message, etc.) you run into the risk of breaking things.  For instance, if you switch two updates, you’ll end up having old data updated in your target system.  It sounds far fetched but in operation it happens <strong>all the time</strong>.

Our solution was to simply send identifiers with the message.  The consumer would interrogate the source system to get the real data.  This way the data it would get would always be up to date.

I wouldn’t recommend using that approach all the time since you lose a lot of benefits from the publish / subscribe mechanism.  For instance, if your message represents an action you want another system to perform (e.g. process order), then having all the data in the message is fine.
<h3>Summary</h3>
This was the key points I learned from working with the Azure Service Bus.

I hope they can be useful to you &amp; your organization.  If you have any question or comments, do not hesitate to hit the comments section!