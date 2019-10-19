---
title: 'Azure basics: Availability sets'
date: 2015-10-21 19:00:29 -04:00
permalink: /2015/10/21/azure-basics-availability-sets/
categories:
- Solution
tags: []
---
What are availability sets in Azure?

In a nutshell, <em>they are a way to define declaratively policies about how your services (VMs, Apps, etc.) are deployed in order to ensure high availability</em>.

To get more specific, you need to understand two more concepts:  Fault Domain &amp; Update Domain.

Two physical machines in a <strong>Fault Domain</strong> share a common power source and network switch.  This means that when there is a <em>physical fault</em>, an outage, all machines on the same fault domain are affected.  Conversely, two machines in two different fault domain shouldn't fail at the same time.

<strong>Update Domain</strong>, on the other hand, define a group of machines that are updated at the same time.  Azure has automatic maintenance patches requiring reboots.  Machines on the same update domain will be rebooted at the same time.

So, if you understand those two concepts, you will realize that if you want your solution to be highly available, you'll want to avoid to either:
<ul>
	<li>Have all instances of the same service on the same fault domain (a physical outage would affect both instances)</li>
	<li>Have all instances of the same service on the same update domain (a planned maintenance would take them both down at the same time)</li>
</ul>
This is where availability sets come in.  Azure guarantees that an availability set has:
<ul>
	<li>5 Update Domains</li>
	<li>2 Fault Domains</li>
</ul>
Those are defaults and can be modified, to an extend.

So by <strong>defining the instances of your services to belong to an availability set</strong>, you ensure they will be spread on different fault and update domains.

Conversely, you'll want the <strong>different tiers of your solution to belong to different availability sets</strong>.  Otherwise, it could happen (depending how the update &amp; fault domains are distributed among the instances, which you do not control) that all the instances of the same tier be rebooted or failed at the same time.
<h3>Summary</h3>
Those were the <span style="text-decoration:underline;">two big rules</span> with availability set, which you could coalesce in one:

<strong>Define an availability set per application tier, have more than one instance per tier and load balance within a tier</strong>.

&nbsp;