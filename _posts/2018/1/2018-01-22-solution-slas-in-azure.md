---
title: Solution SLAs in Azure
date: 2018-01-22 03:30:44 -08:00
permalink: /2018/01/22/solution-slas-in-azure/
categories:
- Solution
tags:
- Mathematics
use_math: true
---
<a href="/assets/posts/2018/1/solution-slas-in-azure/pexels-photo-327533.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-327533" src="/assets/posts/2018/1/solution-slas-in-azure/pexels-photo-327533_thumb.jpg" alt="pexels-photo-327533" width="320" height="200" align="right" border="0" /></a>Let’s talk about Service Level Agreement (SLA) of your solution in Azure.

Hal Berenson wrote a <a href="https://hal2020.com/2017/12/13/service-level-agreements-sla/">great article about SLA lately</a>.  It is a great conceptual background for the present today.

Here we want to focus on how you should proceed to come up with an SLA for your solution.

Although we are going to use Azure in all examples, most of the guidance apply to any public cloud solution.

I see a lot of customers who take a common short cut.  They take the component with the highest SLA (say %99.95) and assign it for their entire solution.  This is quick indeed but as we’ll see, it gives a very optimistic (hence risky for the provider) SLA.

Here we will discuss an approach to establish a theoretical SLA baseline based on the SLAs of sub components.

We’ll talk of <em>availability</em> SLA.  The same logic would apply on other characteristics, e.g. performance, durability, etc.  .
<h2>SLA for Service Consumer</h2>
<a href="/assets/posts/2018/1/solution-slas-in-azure/image19.png"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb19.png" alt="image" width="225" height="240" align="left" border="0" /></a>For a service consumer, the SLA is part of the specs of the service and sets the expectations.  It is something we design against.

It is also something <em>guaranteed</em>, i.e. it is backed financially.  That part is important and it isn’t.  It shows the service provider puts its money where its mouth is:  it will refund us when it fails the SLA.  But it doesn’t back our business.  We might get a refund of $15 because a service was down for an extra 30 minutes a month.  But how much is 30 minutes worth of business during peak hours?

Beside the contractual SLA, what is interesting is the actual average uptime of a service.
<h2>SLA for Service Provider</h2>
<a href="/assets/posts/2018/1/solution-slas-in-azure/image20.png"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb20.png" alt="image" width="320" height="228" align="right" border="0" /></a>For a Service Provider, the SLA is a compromise.  It’s compromise for engineering who would like it to be as low as possible so they can ensure they can hit it (e.g. 20 hours a week).  It’s a compromise for sales too.  Sales likes SLA as high as possible so they can attract customers with an aura of reliability (e.g. %99.9999).

Missing an SLA means financial penalty but also reputation penalty.  If you miss it too often, consumer can’t rely on it and usage will likely drop.

It’s a tough act to balance and this is why the approach we will lay out should help to establish a baseline.
<h2>Azure SLAs</h2>
Azure has a comprehensive list of SLA <a href="https://azure.microsoft.com/en-us/support/legal/sla/">documented here</a>.

For instance, <a href="https://azure.microsoft.com/en-us/support/legal/sla/app-service/v1_4/">App Service SLA is %99.95</a> (at the time of this writing, early 2018).  Most (if not all) Azure SLAs are monthly, which means the counters resets every month.

Those are contractual SLAs.  For actual measured average uptimes, a good reference is <a href="https://cloudharmony.com/cloudsquare">Cloud Harmony</a>.  They measure most public cloud providers (including obscure ones).  Cloud Harmony belongs to Gartner which makes it independent from cloud vendors.  They provide uptime measures for the past 30 days for <a href="https://cloudharmony.com/cloudsquare#compare-azure:compute">VMs</a>, <a href="https://cloudharmony.com/cloudsquare#compare-azure:storage">storage</a>, <a href="https://cloudharmony.com/cloudsquare#compare-azure:cdn">CDN</a>, <a href="https://cloudharmony.com/cloudsquare#compare-azure:websites">Web site</a> &amp; <a href="https://cloudharmony.com/cloudsquare#compare-azure:table">Databases</a>.

Uptime routinely scores %100, even across regions.  Sometimes they are a little lower.  Exceptionally they go below SLA in some regions.

Microsoft, like other giant cloud providers, has a lot to lose (in reputation) by missing their SLA.  They invest a lot to avoid it from happening.

It is important to note that Azure is planned to be up %100 of the time.  When there is downtime, it is caused by a human error or hardware malfunction.
<h2>Our Solution in Azure</h2>
So we already put some nuance on the SLA of a Service Provider.

Another fallacy of SLA is to believe the Azure Infrastructure SLA is our solution SLA.  For instance, if a solution runs on an Azure service with %99.95 SLA, our solution has %99.95 of uptime.

This assumes our solution is up %100 of the time whenever the underlying infrastructure is up.  Of course this isn’t possible.  Deployment occurs, bugs occur, configuration glitch occur, etc.  .
<h2>Probability 101</h2>
Can we simply compute a theoretical SLA for a solution using 2 or more Azure services?  Yes we can.

Let’s start with a simple example:  a Web App (<a href="https://azure.microsoft.com/en-us/support/legal/sla/app-service/v1_4/">SLA of %99.95</a>) with a SQL DB (<a href="https://azure.microsoft.com/en-us/support/legal/sla/sql-database/v1_1/">SLA of %99.99</a>).  What is the SLA of that solution?

<a href="/assets/posts/2018/1/solution-slas-in-azure/image22.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb22.png" alt="image" border="0" /></a>

To answer that question, we’ll need a probability 101.  It will be light, it will be fast, but we need it.

We can interpret an SLA as a probability.  Let’s observe the following:  measured availability (over a long period of time) equals the probability of being up (at any given time).

$$
P(\text{service is up}) = availability = \dfrac {\text{total time service is up} }{\text{total time measured} }
$$

Indeed, if a service has availability of %99.9, it means the probability of it being up at any time is %99.9.  It also mean that during 30 days, the service should be down around 43 minutes.

We want to compute the probability of both services (Web App + SQL DB) be up at the same time.

Let’s consider the multiplication law of probability.  That is, if A &amp; B are independent then:
<p align="center">$latex P(\text{A and B}) = P(A) \cdot P(B)$</p>
<p align="left">In our case:</p>
<p align="center">$latex \begin{array}{lcl} P(\text{Web App and SQL DB are up}) &amp;=&amp; P(\text{Web App is up}) \cdot P(\text{SQL DB is up})\\ &amp;=&amp; \%99.95 \cdot \%99.99\\ &amp;=&amp; \%99.94 \end{array}$</p>
<p align="left">This is often is a surprising result for customers we speak to.</p>
<p align="center"><a href="/assets/posts/2018/1/solution-slas-in-azure/image23.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb23.png" alt="image" border="0" /></a></p>
<p align="left">But if we think about it, the fact the compound SLA is lower than each individual SLA does make sense.  Each component can fail independently.  So the more components, the more failures can occur.</p>

<h2 align="left">Independent SLAs</h2>
<p align="left">There is a bias in the previous computation.</p>
<p align="left">We assumed that both service failures were independent events.  That is debatable.</p>
<p align="left">Different services are isolated.  This means they fail independently.  But they aren’t %100 isolated in the sense they still share some failure modes.  Some events could take both services down.  For instance a natural disaster.  More common would be a bug introduced in the region’s compute fabric.</p>
<p align="left">Parts of the failure probability for each service aren’t independent of each other.  In general, assuming both SLAs are independent is pessimistic.  It results in a compound SLA lower than measured.</p>
<p align="left">There are no easy way to estimate that though.  This is one of the reasons why measures are necessary.</p>

<h2>Boosting Availability</h2>
Let’s consider ways to boost availability in public cloud.  A classic method:  load balancing / failing over across regions.

Let’s consider a simple scenario first:  storage RA-GRS.  Local Redundant Storage (i.e. LRS) has an <a href="https://azure.microsoft.com/en-us/support/legal/sla/storage/v1_3/">SLA of %99.9</a>.  Reads on read only Global Redundant Storage (RA-GRS) have a SLA of %99.99.  Let’s try to understand why.

We have the following solution:

<a href="/assets/posts/2018/1/solution-slas-in-azure/image24.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb24.png" alt="image" border="0" /></a>

and we want to know what is the SLA of that solution.  Here the problem is different.  Both services don’t depend on each other:  they complement each other.

What we want to know is what is the probability that <em>at least one</em> of the services is up.  One of them being up is enough.

For that, we need to consider some probability laws again.  The negation of a probability is easy to compute:
<p align="center">$latex P(down) = 1 - P(up)$</p>
Using simple mathematical manipulations, we can find the probability we are looking for:
<p align="center">$latex \begin{array}{lcl}P(\text{A or B is up}) &amp;=&amp; 1 - P(\text{A and B are down})\\ &amp;=&amp; 1 - P(\text{A is down}) \cdot P(\text{B is down}) \\&amp;=&amp; 1 - (1 - P(\text{A is up})) \cdot (1 - P(\text{B is up}))\end{array}$</p>
Now let’s consider RA-GRS:
<p align="center">$latex \begin{array}{lcl}P(\text{Primary or Secondary is up}) &amp;=&amp; 1 - (1 - P(\text{Primary is up})) \cdot (1 - P(\text{Secondary is up}))\\&amp;=&amp; 1 - (1 - \%99.9) \cdot (1 - \%99.9)\\&amp;=&amp; 1 - \%0.1 \cdot \%0.1\\&amp;=&amp; 1 - \%0.0001\\&amp;=&amp;\%99.9999\end{array}$</p>
Boom.  We can imagine that this is the computation behind the SLA of RA-GRS.

<a href="/assets/posts/2018/1/solution-slas-in-azure/image25.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb25.png" alt="image" border="0" /></a>

Let’s notice a caveat though.  This is the SLA that at least one region’s storage is up.  There is no load balancing / failing over at the service level.  This means the service’s client must try one then try the other if the primary fails.  We will take that into account in the next few examples.

Let’s consider our solution with a Web App and a SQL DB.  For simplification, let’s assume the SQL DB is either static or read only on the secondary site.

<a href="/assets/posts/2018/1/solution-slas-in-azure/image26.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb26.png" alt="image" border="0" /></a>
<p align="center">$latex \begin{array}{lcl}P(\text{Primary or Secondary is up}) &amp;=&amp; 1 - (1 - P(\text{Primary is up})) \cdot (1 - P(\text{Secondary is up}))\\&amp;=&amp; 1 - (1 - \%99.94) \cdot (1 - \%99.94)\\&amp;=&amp; 1 - \%0.06 \cdot \%0.06\\&amp;=&amp; 1 - \%0.000036\\&amp;=&amp;\%99.9964\end{array}$</p>
<a href="/assets/posts/2018/1/solution-slas-in-azure/image27.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb27.png" alt="image" border="0" /></a>

This is a nice SLA.  But as we noticed in the RA-GRS example, the client needs to be the one implementing the failover.  This isn’t acceptable in a web scenario.  Let’s implement the failover on the service side by using Azure Traffic Manager (<a href="https://azure.microsoft.com/en-us/support/legal/sla/traffic-manager/v1_0/">SLA %99.99</a>).

<a href="/assets/posts/2018/1/solution-slas-in-azure/image28.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb28.png" alt="image" border="0" /></a>

How do we compute the SLA of that solution?

<strong>UPDATE (22-01-2018):  There was an error in the original publication.  Thanks <a href="https://twitter.com/d_chapdelaine">@d_chapdelaine</a> for pointing it out!</strong>

We need to chain the Traffic Manager with the fail-over solution (i.e. %99.9964).
<p align="center">$latex \begin{array}{lcl} P(\text{TM and fail over is up}) &amp;=&amp; P(\text{TM is up}) \cdot P(\text{Either Primary or Secondary is up})\\ &amp;=&amp; \%99.99 \cdot \%99.9964\\ &amp;=&amp; \%99.9864 \end{array}$</p>
Yes, by adding Traffic Manager in front of our web solution, we weaken it.  Doing it on the client side was %99.9964 while on the service side it is %99.9864.  But we are still higher than the %99.94 of a single region, but inching to something higher.

<a href="/assets/posts/2018/1/solution-slas-in-azure/sla2.png"><img class="size-full wp-image-4433 aligncenter" src="/assets/posts/2018/1/solution-slas-in-azure/sla2.png" alt="" /></a>

In general, as we see, load balancing across region does boost SLA but it is quite expensive to not gain a <em>nine</em>.

Challenges come with stateful solutions (the majority of interesting solutions).  It requires replicating data to the secondary region.  But it also requires failing over to the secondary region prior being able to write there.  It is a case of a macro state machine.
<h2>Calculating SLA on a real solution</h2>
Let’s consider a more realistic solution with 4 tiers:
<ul>
 	<li>Application Gateway as Reverse Proxy / WAF (<a href="https://azure.microsoft.com/en-us/support/legal/sla/application-gateway/v1_1/">SLA of %99.95 for 2+ medium / large instances</a>)</li>
 	<li>A VM Scale Set as front end (<a href="https://azure.microsoft.com/en-us/support/legal/sla/virtual-machines/v1_6/">SLA same as VM, i.e. %99.95 for 2+ instances in an availability set</a>)</li>
 	<li>Another VM Scale Set as application layer</li>
 	<li>Azure SQL as DB</li>
</ul>
<a href="/assets/posts/2018/1/solution-slas-in-azure/image30.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/1/solution-slas-in-azure/image_thumb30.png" alt="image" border="0" /></a>

The compound SLA is the product of probability, hence %99.84.

This example brings to the forefront that it can be easy to drop below 3-nines if we aren’t careful.
<h2>Scenarios</h2>
Sometimes it can be interesting to consider scenarios instead of the entire solution.

Azure Storage is a good example:  the reading vs writing scenarios do not have the same SLA for RA-GRS.

We could consider scenarios where the DB isn’t involved in previous examples.  SLA would be higher for those scenarios.

Let’s consider a solution where Azure AD B2C authenticate end-users.  For scenarios where the user is authenticated, the Azure AD B2C doesn’t need to be up.  Again, that would improve the SLA for those scenarios.

It is useful to consider scenarios when the solution implements distinct business processes.  Those business processes are understood by the consumer.  Having different SLAs for different processes can bring nuance on the offering.  It can also add complexity.

A good example is an e-Commerce solution having different SLAs:
<ul>
 	<li>One for consulting the catalog (read only)</li>
 	<li>One for interacting with the cart (session writing)</li>
 	<li>One for passing a command (back-end interaction)</li>
</ul>
Those three SLAs refer to business process the end user can easily identify.

Architecting our solution to “gracefully degrade experience” when components fail also improve SLA.  This is easier than done in most cases, especially for existing applications.
<h2>Theory vs Measure</h2>
As Hal’s article mentioned, the sure way to establish a SLA is to combine theoretical value and measures.

We definitely encourage you to measure the availability of your solution.  This would allow to iron out up all the bias we mentioned.

In this article we articulated a methodology.  We should use it to establish a theoretical baseline.  This is useful before measures are available.  For instance, it is useful to orient the design at the architecture stage.  Measures should definitely complement it once they become available.
<h2>Summary</h2>
Let’s recap as we are aware that was a lot of material.

We need to establish the SLA of our solution at a level:
<ul>
 	<li>Low enough we are comfortable delivering</li>
 	<li>High enough to be attractive to service consumers</li>
</ul>
The methodology we articulated here helps determine a theoretical baseline.  It combines SLAs of services used for the solution.

When services depend on each other (e.g. the Web App on the SQL DB), we multiply SLAs.  When services complement each other (multi-region failovers), we have another formula.

Beyond compounding Azure services, we need to consider application failure modes:
<ul>
 	<li>Down-time related to deployment</li>
 	<li>Bugs introduced in deployment</li>
 	<li>etc.</li>
</ul>
We can boost the SLA of a solution by implementing a multi-region failover.  This increases the complexity and cost of the solution.

We can consider separate scenarios with separate SLAs.  We can also architect in a way to gracefully degrade experience if some sub-services go down.

It is important to measure availability to get a realistic SLA.

We can then iterate to either improve the SLA or optimize the cost of the solution.