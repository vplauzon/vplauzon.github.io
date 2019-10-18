---
title:  Moving existing workloads to Azure
date:  2016-12-12 19:16:55 +00:00
permalink:  "/2016/12/12/moving-existing-workloads-to-azure/"
categories:
- Solution
tags:
- Virtual Machines
---
<a href="assets/2016/12/moving-existing-workloads-to-azure/space-shuttle-lift-off-liftoff-nasa11.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="From https://www.pexels.com/" src="assets/2016/12/moving-existing-workloads-to-azure/space-shuttle-lift-off-liftoff-nasa1_thumb1.jpg" alt="From https://www.pexels.com/" width="317" height="266" align="right" border="0" /></a>

Applications born in the cloud can take full advantage of the cloud and the agility it brings.

But there are a lot of existing solutions out there that weren’t born in the cloud.

In this article I want to sketch a <strong>very high level </strong>approach on how to proceed about taking an existing on premise solution and move it to Azure.

Let’s first talk about pure Lift &amp; Shift.  Lift &amp; Shift refers to the approach of taking on premise workloads and deploying them <strong>as-is</strong> in Azure.

Despite its popularity, it receives a <a href="https://www.thoughtworks.com/radar/techniques/cloud-lift-and-shift" target="_blank">fair bit of bad press</a> because performing a lift and shift doesn’t give you most of the advantage of the cloud, mainly the agility.

I agree with the assessment since a lift and shift basically brings you to the cloud with a pre-cloud paradigm.  That being said, I wouldn’t discard that approach wholesale.

For many organizations, it is one of the many paths to get to the cloud.  Do you move to the cloud and then modernize or modernize in order to move to the cloud?  It’s really up to you and each organization have different constraints.

It often makes sense especially for dev &amp; test workloads.  Dev + Test usually:
<ul>
 	<li>Do not run 24 / 7</li>
 	<li>Do not have High Availability requirements</li>
 	<li>Do not have sensitive data ; unless you bring back your production data, without trimming the sensitive data, for your dev to fiddle with, in which case sensitive data probably isn’t a concern to you</li>
</ul>
The first point means potential huge economy.  Azure tends to be cheaper than on premise solutions but if you only run it part time, it definitely is cheaper.

The last two points make Dev + Test workloads easier to move, i.e. there are less friction along the way.

Where I would be cautious is to make sure you do not need to do a lot of costly transformations in order to purely do a lift and shift ; if that’s the case I would consider modernizing first, otherwise there won’t be budget in the bucket for the modernization later.
<h2>Address blockers</h2>
<strong><a href="assets/2016/12/moving-existing-workloads-to-azure/red-building-industry-bricks11.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="red-building-industry-bricks[1]" src="assets/2016/12/moving-existing-workloads-to-azure/red-building-industry-bricks1_thumb1.jpg" alt="red-building-industry-bricks[1]" width="376" height="250" align="left" border="0" /></a>Will it run on Azure</strong>?  Most x86 stuff that run on a VM will run in Azure, but not all.  Typically this boils down to unsupported network protocols and shared disks.  Azure supports most IP protocols, except <a href="https://en.wikipedia.org/wiki/Generic_Routing_Encapsulation" target="_blank">Generic Routing Encapsulation</a> (GRE), <a href="https://en.wikipedia.org/wiki/IP_in_IP" target="_blank">IP in IP</a> &amp; <a href="https://en.wikipedia.org/wiki/Multicast" target="_blank">multicast</a> ; <a href="https://en.wikipedia.org/wiki/User_Datagram_Protocol" target="_blank">User Datagram Protocol</a> is supported but not with multicast.  Shared disks are not supported in Azure:  every disk belong to one-and-only-one-VM.  Shared drive can be mounted via <a href="https://docs.microsoft.com/en-us/azure/storage/storage-dotnet-how-to-use-files" target="_blank">Azure File Storage</a>, but for application requiring a disk accessible by multiple VMs, that isn’t supported.  This often is the case with Quorum disk-based HA solutions, e.g. <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-classic-oracle-considerations#oracle-database-virtual-machine-images" target="_blank">Oracle RAC</a>.

If you hit one of those walls, the question you have to ask yourself is <strong>are there any mitigation</strong>?  This will vary greatly depending on your solution and the blockers you face.

<strong>Does it provide suitable High Availability (HA) feature support</strong>?  A lot of on premise solution relies on hardware for high availability, while cloud-based solutions rely on software, typically by having a cluster of identical workload fronted by a load balancer.  In Azure, this is less of a blocker as it use to be, thanks to the new <a href="https://vincentlauzon.com/2016/11/23/single-vm-sla/">single VM SLA</a>, which isn’t a full fledged HA solution but at least provide a SLA.

<strong>Will it be supported in Azure</strong>?  You can run it, now will you get support if you have problems?  This goes for both Microsoft support and other vendors support.  Some vendors won’t support you in the cloud, although the list of such vendors is shrinking everyday.  A good example of support is Windows Server 2003 in Azure:  it isn’t supported out-of-the-box, although it will work.  You do need a <em>Custom Support Agreement</em> (CSA) with Microsoft since Windows Server 2003 is no longer a supported product.

<strong>If not, does it matter and / or will ISV work with you</strong>?  If you aren’t supported, it isn’t always the end of the road.  It might not matter for dev-test workloads.  Also, most ISVs are typically willing to work with you to make it possible.

<strong>Does it have a license that allow running in Azure</strong>?  Don’t forget the licenses!  Some vendors will have some funky licensing schemes for solution running in the cloud.  One question I get all the time is about Oracle, so here is the answer:  yes Oracle can be licensed under Azure and no you don’t have to pay for all the cores of the physical server you’re running on ; <a href="http://www.oracle.com/us/corporate/pricing/cloud-licensing-070579.pdf" target="_blank">read about it here</a>.
<h2>Address limitations</h2>
<a href="assets/2016/12/moving-existing-workloads-to-azure/fence-1809742_64011.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="fence-1809742_640[1]" src="assets/2016/12/moving-existing-workloads-to-azure/fence-1809742_6401_thumb1.jpg" alt="fence-1809742_640[1]" width="339" height="226" align="right" border="0" /></a>

<strong>Time Window to transition should drive your strategy</strong>.  This might sound obvious but often people do not know where to start, so start with your destination:  when do you want to be done?

<strong>Authentication mechanism (Internal vs External)</strong>.  Do you need to bring your Domain Controllers over or can you use Azure AD?  Do you have another authentication mechanism that isn’t easy to migrate?

<strong>VM Requirements:  cores, RAM, Disk, IOPS, bandwidth</strong>.  Basically, do a sizing assessment and make sure you won’t face limitations in Azure.  The number of VM skus has grown significantly in the last year but I still see on premise workloads with “odd configuration” which are hard to migrate to Azure economically.  For instance, a VM with 64 Gb of RAM and only one core will need to be migrated to a VM with many cores and the price might not be compelling.  Disks are limited to 1Tb in Azure (as of this writing, December 2016), but you can stripe many disks to create an OS volume.  That being said, different VM skus have different number of disk limits.

<strong>Latency requirements (e.g. web-data tier)</strong>.  Basically, no, if you put your front end in East US and the back-end in South India, latency won’t be great.  But in general if you have a low latency requirement, make sure you can attain it with the right solution in Azure.

<strong>Solution SLA</strong>.  Azure offers great SLAs but if you have a very aggressive SLAs, in the 4-5 nines, you’ll need to push the envelope in Azure which will affect the cost.

<strong>Recovery Time Objective (RTO) &amp; Recovery Point Objective (RPO)</strong>.  Again, this will influence your solution which will influence the cost.

<strong>Backup strategy / DR</strong>.  Similar to the previous point:  make sure you architect your solution accordingly.

<strong>Compliance standards</strong>.  Different services have different compliances.  <a href="https://www.microsoft.com/en-us/trustcenter/Compliance/default.aspx" target="_blank">See this</a> for details.

Basically, for most of those points, the idea is to consider the point and architect the solution to address it.  This will alter the cost.  For instance, if you put 2 instances instead  of 1, you’re gona pay for twice the compute.
<h2>Make it great</h2>
<a href="assets/2016/12/moving-existing-workloads-to-azure/london-140785_64011.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="london-140785_640[1]" src="assets/2016/12/moving-existing-workloads-to-azure/london-140785_6401_thumb1.jpg" alt="london-140785_640[1]" width="423" height="280" align="left" border="0" /></a>

We have our solution.  We worked through the blockers &amp; limitations, now let’s take it to the next level.

<strong>Storage</strong>:  check out <a href="https://azure.microsoft.com/en-us/documentation/articles/storage-performance-checklist/" target="_blank">Microsoft Azure Storage Performance and Scalability Checklist</a>.

<strong>Scalability</strong>:  consult the <a href="https://azure.microsoft.com/en-us/documentation/articles/best-practices-scalability-checklist/" target="_blank">best practices on scalability</a>.

<strong>Availability</strong>:  make sure you’ve been through the <a href="https://azure.microsoft.com/en-us/documentation/articles/best-practices-availability-checklist/" target="_blank">availability checklist</a> &amp; the <a href="https://azure.microsoft.com/en-us/documentation/articles/resiliency-high-availability-checklist/" target="_blank">high availability checklist</a>.

<strong>Express Route</strong>:  define your connectivity strategy &amp; consider <a href="https://azure.microsoft.com/en-us/documentation/articles/expressroute-prerequisites/" target="_blank">Express Route prerequisites</a>

<strong>Guidance</strong>:  in general, consult <a href="https://azure.microsoft.com/en-us/documentation/articles/guidance/" target="_blank">the Patterns &amp; Practices guidance</a>.
<h2>Get it going</h2>
As with every initiative involving change, the temptation is to do a heavy analysis before migrating a single app.  People want to get the networking right, the backup strategy, the DR, etc.  .  This is how they do it on premise when creating a data center so this is how they want to do it in Azure.

For many reasons, this approach isn’t optimal in Azure:
<ul>
 	<li>The constraints aren’t the same in Azure</li>
 	<li>People often have little knowledge of Azure or the cloud in general and therefore spin their wheels for quite a while looking for issues while being blind to the issues that will cause them problem (usual unknown-unknowns problem)</li>
 	<li>The main advantage of the cloud is agility:  long up-front analysis in order to attain agility is the straightest line between the two points</li>
</ul>
This is why I always give the same advise:  start now, start small, start on something low-risk.  If you migrate 30 solutions and realize that you bust a limit of Virtual Network and have to rebuild it one week-end, that’s expensive.  But if you migrate a solution, experiment, realize that the way you laid out the Network won’t scale to 30, you tear it down and rebuild it:  this will be much cheaper.

<a href="assets/2016/12/moving-existing-workloads-to-azure/image6.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/12/moving-existing-workloads-to-azure/image_thumb6.png" alt="image" width="497" height="226" align="right" border="0" /></a>I’m not advocating to migrate all your environments freestyle in a cowboy manner, quite the opposite:  experiment with something real and low-risk and build from there.  You will learn from the experiment and move forward instead of experimenting in vacuum.  As you migrate more and more workloads, you’ll gain experience and expertise.  You’ll probably start with dev-test and in time you’ll feel confident to move to production workloads.

Look at your application park and try to take a few solutions with little dependencies, so you can move them without carrying your entire park with it.

The diagram I’ve put here might look a bit simplistic.  To get there you’ll probably have to do a few transformations.  For instance, you might want to consider replicating your domain controllers to replica in Azure to break that dependency.  There might be a system everything depend on in a light way ; could your sample solutions access it through a VPN connection?
<h2>Summary</h2>
<a href="assets/2016/12/moving-existing-workloads-to-azure/image7.png"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/12/moving-existing-workloads-to-azure/image_thumb7.png" alt="image" width="356" height="237" align="left" border="0" /></a>I tried to summarize the general guidelines we give to customers when considering migration.

This is no one X steps plan, but a bunch of considerations to remove risk from the endeavor.

Cloud brings agility and agility should be your end goal.  The recipe for agility is simple:  small bites, quick turn around, feedback, repeat.  This should be your guideline.