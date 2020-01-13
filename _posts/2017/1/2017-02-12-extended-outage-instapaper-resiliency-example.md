---
title: Extended Outage @ Instapaper - Resiliency example
date: 2017-02-12 16:00:28 -08:00
permalink: /2017/02/12/extended-outage-instapaper-resiliency-example/
categories:
- Solution
tags:
- Data
---
<a href="/assets/posts/2017/1/extended-outage-instapaper-resiliency-example/art-broken-explosion-glass1.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="art-broken-explosion-glass[1]" src="/assets/posts/2017/1/extended-outage-instapaper-resiliency-example/art-broken-explosion-glass1_thumb.jpg" alt="art-broken-explosion-glass[1]" width="300" height="192" align="right" border="0" /></a>I use <a href="http://instapaper.com" target="_blank">Instapaper</a> extensively to store the continuous flow of internet articles I want to read.  I created a bunch of tools integrating with it (e.g. monitoring atom feeds and sending new articles to Instapaper)

Last week my tools didn’t work for a while so I finally logged in directly to the site.  The site was down, citing an <em>extended outage</em>, with a reference to a <a href="http://blog.instapaper.com/post/157027537441" target="_blank">blog article</a> to explain the outage.

It got back on its feet after around 48 hours.  This isn’t an article to call out Instapaper’s engineering:  that type of outage happens everywhere all the time.  But let’s learn from it.

The article cites the cause of the outage as being “we hit a system limit for our hosted database that’s preventing new articles from being saved”.  The article also cite they had to spent time on the phone with their <em>cloud provider</em> (didn’t mention which one) before diagnosing the problem.
<h2>Know the limits</h2>
They hit a limit.

What are the limits?

A clear advise when working in Azure:  know where your sandbox ends.  We should always consult <a href="http://aka.ms/azurelimits">http://aka.ms/azurelimits</a> to inform our architecture.

The nice thing about the cloud is that most limit are clearly defined and embedded in SLAs.

This comes as a surprise to a lot of people, especially when they see some of the restrictions.  “How come?  I can only put 2 disks on a <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes?toc=%2fazure%2fvirtual-machines%2fwindows%2ftoc.json#dv2-series" target="_blank">Standard D1 v2 VM</a>?”  This is because the experience we have on premise where there are few hard wired limitations.  Instead, we typically have degradations, e.g. sure you can put a Terabyte storage on your old laptop, but you are likely going to saturate its IOs before you will exhaust the storage.  In Azure, it is more clearly defined because Azure is a public cloud, i.e. a multi-tenant environment.  The only way for Azure to guarantee other customers they can have capacity X is to make sure we do not use that capacity.  So there are sandboxes everywhere.

On the flipside, you have less surprises.  The reason you do not have so many sandboxes on prem is that everything is shared.  That is nice as long as we are the only one to crank the resource usage.  But when other systems start grinding that SAN, it isn’t so fast anymore.

So first lesson we get from that Instapaper outage is to know the limit.  Did the Instapaper know the limits of their database?  Did they hit some software limit, e.g. they used all the 32 bits of an identifier column?
<h2>Monitor for those limits</h2>
Now that we know the limits, we know when our system is going to break.

So we need to monitor it so that we won’t have a bad surprise as Instapaper team must have had (I’m sure some dinners were cancelled during those 48 hours).

In Azure, we can use <a href="https://vincentlauzon.com/2016/11/27/primer-on-azure-monitor/" target="_blank">Azure Monitor / Log Analytics</a> to monitor different metrics on our resources.  We can setup alerts to be notified when some threshold has been reached.

We can then react.  If we setup the threshold low enough, that will give us a window of time to react and to sketch a plan.

In an article on <a href="https://vincentlauzon.com/2017/01/04/azure-sql-elastic-pool-database-size/" target="_blank">SQL Database sizes in an elastic pool</a>, we saw that we can fix a limit on database size to make sure it doesn’t consume the allowed size of the entire pool.  This is a safeguard mechanism in case our monitoring strategy fails.
<h2>Strategy to get beyond the limits</h2>
We know the limits of our architecture.  We monitor our system to get some heads up before those limits are reached.

When they are reached, what do we do?

Typically, if we’re aware of the limits, we will have given it some thoughts, even if it isn’t fully documented.  This is something that goes in handover conversations actually “this system has this limit, but you know, if that ever becomes a problem, consider that alternative”.  Hopefully, the alternative doesn’t consist into re-writing the entire system.
<h2>Scale out / partitioning strategies</h2>
If we are lucky, the original architect(s) of the system have baked in a way to overcome its limits.

A typical way is to partition the system.  We can partition the system per user / group of users or other data segments.  This way, we can scale out the system to handle different partitions.

We can start with only one set of resources (e.g. Virtual Machines) handling all partitions and the day that set of resource hits its limits, we can split the partitions into two groups and have another set of resources handling the other set of partitions.  And so on.

One day, that partition scheme might also hit its limits.  For instance, maybe we have a set of resources handling only one partition each and most of the set of resource have all hit their limits.  In that case, we’re back to figure out how to go beyond the limits of our system.  Typically, that will consist into repartition it in a way we can scale out further.

Azure is a partitioned / scaled out system.  That strategy has allowed it to grow to its current size.  Along the way, repartitioning was needed.  For instance, the transition of ASM to ARM was partially that.  In ASM, there were only 2 regions handling the Azure Management APIs while in ARM, each region handles API requests.
<h2>Conclusion</h2>
Instapaper was victim of its own success.  That’s a good problem to have but a problem nevertheless.

Make sure you at least know the limits of your system and monitor for them.  This way if success curses you, you’ll be able to react during working hours instead of cancelling your valentine dinner and spending your days justifying yourself to your CEO.