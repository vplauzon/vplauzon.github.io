---
title: Disaster Recovery with Azure Virtual Machines
date: 2016-07-11 11:53:22 -04:00
permalink: /2016/07/11/disaster-recovery-with-azure-virtual-machines/
categories:
- Solution
tags:
- Virtual Machines
---
<strong>UPDATE 09-11-2017</strong>:  <em>See <a href="https://vincentlauzon.com/2017/11/09/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/">Disaster Recovery with VM Scale Sets &amp; Geo-Replicated DBs</a> for an example of the different concepts introduced here.</em>

<strong>UPDATE 31-05-2017</strong>:  <em>This article was written in 07-2016.  Today <a href="https://azure.microsoft.com/en-ca/blog/announcing-disaster-recovery-for-azure-iaas-vms-using-asr/">Microsoft announced Azure Site Recovery (ASR) support for Azure-to-Azure</a> (in public preview).  Options presented in this article are still valid but the assumption that ASR can't help no is longer true.  ASR can now replicate VMs to a secondary region and is the recommended option to replicate IaaS stateful VMs.</em>

<a href="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/kermit-1365914_640.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="kermit-1365914_640" src="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/kermit-1365914_640_thumb.jpg" alt="kermit-1365914_640" width="320" height="480" align="right" border="0" /></a>I have had a few conversations lately about Disaster Recovery in Azure where Virtual Machines are involved.  I thought I would write this article to summarize the options I recommend.

We should really call the topic <em>Business Continuity</em> or <em>Resiliency to Azure Region Service Disruption</em> but traditionally, people call this Disaster Recovery and you find this wording in many deployment requirements, so I guess I have to continue the tradition here.

You can find many of the ideas &amp; patterns exposed here in the <a href="https://azure.microsoft.com/en-us/documentation/articles/resiliency-technical-guidance/" target="_blank" rel="noopener">Resiliency Technical Guidance</a> document and more specifically the <a href="https://azure.microsoft.com/en-us/documentation/articles/resiliency-technical-guidance-recovery-loss-azure-region/" target="_blank" rel="noopener">Recovery from a region-wide service disruption</a> document.
<h2>Context</h2>
First, when you discuss Disaster Recovery plan &amp; more generally resilience to failures, you have to setup the context.

Azure is an <em>Hyper Scale Public Cloud provider</em>.  It isn't your boutique web provider or your corner shop hosting facility.  I say that because some customers I talk to are used to be involved or at least informed when an hard drive blows, a network line is cut or something of the like.  Azure is a <em>software defined platform</em> and is <u>extremely resilient to hardware failures</u>.  If an hard drive fails on one of your service, you would need to perform some very close monitoring to be aware of the failure and recovery.  The Azure Fabric monitors services health and when a service becomes unhealthy, it gets shutdown and redeploy elsewhere.

So the typical <em>disaster</em> do occur, and probably more than in traditional facility since Azure (like every public cloud provider) uses consumer-grade hardware that can fail at any time (i.e. no redundancy built in).  The resiliency comes from the Azure Fabric, i.e. the software defined layer.  And so the typical <em>disaster </em>do occur but you won't be affected by it.

What does happen in Azure is <u>Service disruption</u>.  Sometimes those are due to some hardware failures, but most of the time, they are a software problem:  an upgrade in Azure software (Microsoft’s software) gone wrong.  They happen occasionally, are typically short lived but if business continuity is a hard requirement, those are the ones you should protect your solution against.

In this article I'll cover resilience for virtual machines.  I'll assume that you are using <a href="https://azure.microsoft.com/en-us/documentation/articles/traffic-manager-overview/" target="_blank" rel="noopener">Azure Traffic Manager</a> or other DNS service to fail over the traffic from a primary to a secondary region.

<strong>So here the point is to fail over a solution from a Primary Azure Region to a replica in a Secondary Azure Region with as little business disruption as possible</strong>.

I'll also use the following two concepts:
<ul>
 	<li>Recovery Time Objective (RTO):  maximum amount of time allocated for restoring application functionality</li>
 	<li>Recovery Point Objective (RPO):  acceptable time window of lost data due to the recovery process</li>
</ul>
Those are important and will vary the complexity and cost of your solution.
<h2>False Friends</h2>
Out of the gate, lets clear out a few services that you can sometimes use for fail over but do not work for most complex cases.
<h3>Geo Replicated Storage (GRS)</h3>
The typical starting point is to have your VM hard drives site in a Read-Only Access Geo Redundant Storage (RA GRS).  That should fix everything, right?  The hard drives of the VMs are replicated to a secondary region automatically, so we're good, right?

Well...  there are many caveats to that statement.

First, you need to have Read-Only Access GRS and not only GRS storage.  Pure GRS is replicated but isn't readable unless the primary region is declared "lost" (to the best of my knowledge that never happened).  So this is no good for temporary service disruption.

Second, RA GRS is Read-Only, so you would need to copy the virtual hard drive blobs to another storage account in the secondary region in order to attach them to a VM and fail over.  That will hit your RTO.

Third, replication with GRS is done asynchronously &amp; doesn't have any SLA on the time it takes to replicate blobs.  It typically takes under an hour and often much less than that, but you have no guarantees.  If you have a stiff and short RPO, that's going to be a problem.

Fourth, GRS replicates each blob, hence each hard drive, independently.  So if you have a VM with more than one hard drive per VM, chances are you are going to get a corrupted image at the secondary site since you'll have VM hard drives from different points in time.  Think of a disk for log files and another for DB files coming from two different point in time.

Fifth, GRS replicates between paired regions:  you can't choose towards which region data to replicate.  Paired regions are <a href="https://azure.microsoft.com/en-us/documentation/articles/resiliency-technical-guidance-recovery-loss-azure-region/#storage" target="_blank" rel="noopener">documented here</a> and are within a unique <em>geopolitical region</em>, i.e. a region where laws about data sovereignty are about the same.  That usually is ok for disaster recovery but if it isn’t for your use case, this is another reason why GRS isn’t for you.

For all those reasons, RA GRS rarely is a solution all by itself for failing over.  It can still be used as a component of a more complex strategy and for very simple workloads, e.g. one-HD VMs with loose RPO and long enough RTO, it could be used.

GRS use case is to decrease the likelihood of pure data loss.  It does it very well.  But it is designed to quickly and flexibly replicate data anywhere.
<h3>Azure Site Recovery (ASR)</h3>
<strong>UPDATE 31-05-2017</strong>:  <em>As stated at the beginning of the article, ASR now supports Azure-to-Azure replication.</em>

Azure Site Recovery, as of this date (early July 2016), doesn't support Azure-to-Azure scenario.  ASR main scenario is to replicate an on premise workload, on either Hyper-V or VM ware towards Azure.

Very powerful solution but as of yet, it won't fail over an Azure solution.
<h3>Azure Backup</h3>
Azure Backup seems to be your next best friend after the last two cold showers, right?

Azure Backup, again a great solution, is a backup solution within a region.  It's the answer to:  "how can I recover (roll back) from a corruption of my solution due to some faulty manual intervention", or what I call the "oups recovery".  Again, great solution, works very well for that.

You have the possibility to backup to a Geo Redundant vault.  That vault, like a GRS storage account, isn't accessible until the primary region has completely failed.  Again, to the best of my knowledge, that never happened.
<h2>Some hope</h2>
There is hope, it's coming your way.

We are going to separate the solutions I recommend in two broad categories:  stateless &amp; stateful VMs.

The best example of a stateless VM is your Web Server:  it runs for hours but beside writing some logs locally (maybe), its state doesn't change.  You could shut it down, take a copy of the drives from 3 days ago and start it, it would work and nobody would notice.

A stateful VM is the opposite.  A good example?  A database.  Its state changes constantly with transactions.
<h2>Stateless VMs</h2>
Stateless VMs are easier to deal with since you do not have to replicate constantly but just when you do changes to your VM.
<h3>Stateless 1 – Virtual Machine Scale Sets</h3>
If your VMs are stateless, then the obvious starting point is not to manage VMs at all but manage a recipe on how to build the VMs.  This is what <a href="https://azure.microsoft.com/en-us/documentation/articles/virtual-machine-scale-sets-overview/" target="_blank" rel="noopener">Virtual Machine Scale Sets</a> are about.

You describe a scale set in an ARM Template, adding some <a href="https://msdn.microsoft.com/en-us/PowerShell/dsc/overview" target="_blank" rel="noopener">Desired State Configuration</a> (DSC), PowerShell scripts, <a href="https://puppet.com/resources/white-paper/getting-started-deploying-puppet-enterprise-microsoft-azure" target="_blank" rel="noopener">Puppet</a> or <a href="https://www.chef.io/solutions/azure/" target="_blank" rel="noopener">Chef</a> scripts and bam!  you can have as many replica of those VMs as you want, on demand.

Scale Sets, as their name suggest, are meant to auto <em>scale</em>, but you could also use it to quickly spin up a disaster recovery site.  Simply scale them from zero to 2 (or more) instances and you have your stateless VMs ready.

The drawbacks of that solution:
<ul>
 	<li>Many custom solutions aren’t automated enough to be used within a Scale Set without major effort</li>
 	<li>Provisioning VMs under scale set can take a few minutes:  on top of booting the VMs, Azure first need to copy an Azure Marketplace (AMP) image as the starting point and then execute various configuration scripts to customize the VM.</li>
</ul>
In the case the second point is a show stopper for you (e.g. you do have a very short RTO), there are a few ways you could still use scale sets.  What you probably need is a hot standby disaster site.  In that case, let 2 VMs run in the scale set at all time and scale it to more if you really fail over.
<h3>Stateless 2 - Copy VHDs</h3>
For solutions that haven’t reached the automation maturity required to leverage scale sets or where operational requirements do not allow it, you can continue to manage VM as in the good old days.

The obvious solution attached to this practice is to copy the VM Hard Drive blob files to the secondary regions.

<a href="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/image_thumb.png" alt="image" width="988" height="479" border="0" /></a>

This solution usually sits well with the operational models handling custom images (as opposed to automated ones):  maintenance are performed on VMs in orderly manner (e.g. patches) and once this is done, the VHDs can be copied over to the secondary storage account.

A detail remains:  how do you copy the hard drives?  I would recommend two options:
<ol>
 	<li>Shutdown (get a clean copy)
<ul>
 	<li>Shutdown the VM</li>
 	<li>Copy VHD blobs</li>
 	<li>Reboot the VM</li>
 	<li>Go to the next VM</li>
</ul>
</li>
 	<li>Snapshots
<ul>
 	<li>Take a snapshot of the blobs of each VHD</li>
 	<li>Copy the snapshots</li>
 	<li>Destroy the snapshots (to avoid <a href="https://msdn.microsoft.com/en-us/library/azure/hh768807.aspx" target="_blank" rel="noopener">incurring costs on storage for the deltas</a>)</li>
</ul>
</li>
</ol>
<a href="https://msdn.microsoft.com/en-us/library/azure/hh488361.aspx" target="_blank" rel="noopener">Blob snapshot</a> is a powerful feature allowing you to create a read-only version of a blob in-place that is frozen in time.  It’s quick because it doesn’t copy the entire blob, it simply keeps it there and start saving deltas from then.

There are two challenges with snapshots.  First you need to snapshot all the hard drives of one VM at about the same time ; not impossible, but it requires some thoughts.  Second, this will give you a <em>Crash Consistent</em> image of your system:  it’s basically as if you pulled the cable on the VM and shut it down violently.

Depending on what workload is running on the VM, that might not be a good idea.  If that’s the case or you aren’t sure if it is, use the shut-down / copy / reboot approach:  it’s more hassle, but it guarantees you’ll have a clean copy.
<h2>Stateless 3 – Capture the image</h2>
If the other methods failed, you might want to create an image out of your VMs.  This means a generalized VM that once you boot, you’ll assign a new identity (name).

For that you need to <a href="https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-windows-capture-image/" target="_blank" rel="noopener">capture the image of an existing VM</a>.  You could then copy that over to the secondary location, ready to be used to create new VMs.

You could actually use that in conjunction with the Scale Set approach:  instead of starting from an Azure Marketplace (AMP) image, you could start with your own and do very little configuration since your image contains all the configuration.
<h2>Stateful VMs</h2>
As stated before, stateful VMs are different beasts.  Since their state evolves continuously, you need to backup the state continuously too.
<h3>Stateful 1 – Regular backups</h3>
Here you can use any of the methods for stateless VMs in order to backup the data.

Typically you’ll want to segregate the disks containing the transactional data from the other disks (e.g. OS disks) in order to backup only what changes.

You can then do copies at regular intervals.  The size of the intervals will define your RPO.

The major weakness of this method is that since you will copy whole data disks (as opposed to deltas), this will take time &amp; therefore limit the RPO you can achieve.  It will also increase the cost of the solution with both the storage operation but with inter-region bandwidth too.
<h3>Stateful 2 – Application-based Backup (e.g. DB Backup)</h3>
This solution will sound familiar if you’ve operated databases in the past.

Segregate a disk for backups.  That disk will only contain backups.  Have your application (e.g. database) backup at regular intervals on that disk.  Hopefully, you can do incremental backups to boost efficiency &amp; scalability so you do not backup the entire state of your system every single time.  So this should be more efficient than the previous option.

Then you have a few options:
<ol>
 	<li>You can copy the entire hard drive to another storage account in the secondary Azure region ; of course, doing so reduces your scalability (RPO) since that is likely a lot of data.</li>
 	<li>You can have that VHD sit in a GA-GRS account.  This will replicate only the bits that change to the secondary location.  Again, there are no SLA on when this will occur, but if you have a loose RPO, this could be ok.</li>
 	<li>You could AzCopy the backup / incremental backup files themselves to the secondary site.</li>
</ol>
The advantage of this approach is that you do not need any VM to be up in the secondary Azure region, hence reducing your costs.

The main disadvantage is that you go with backups and therefore limits the RPO you can achieve.
<h3>Stateful 3 – Application-based Replication (e.g. DB replication)</h3>
Instead of using the application to backup itself, use the replication mechanism (assuming there is one) to replicate the state to the secondary Azure region.

<a href="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/2016/7/disaster-recovery-with-azure-virtual-machines/image_thumb1.png" alt="image" width="921" height="201" border="0" /></a>

Typically that would be asynchronous replication not to impact the performance of your system.

This approach lets you drive the RPO down with most systems.  It also drives the cost up since you need to have VMs in the secondary region running at all time.

There are a few ways you could reduce that costs:
<ol>
 	<li>If your replication technology can tolerate the replica to be offline once in a while, you could live with only one VM in the secondary site.  This would half the compute cost but also drop the SLA on the availability of the VMs in the secondary site.  Make sure you can live with that risk.</li>
 	<li>You could have your replica run on smaller (cheaper) VMs.  Only when you failover would you shutdown one of the VM, upgrade it to the proper size, then reboot it and do the same with the other one (or ones).  If your system can run with slow stateful VMs for a while, this could be acceptable.</li>
</ol>
<h2>Conclusion</h2>
In this article we covered the scenario of surviving an Azure Service disruption to keep your application running.

We did analyse many alternatives and there are still many sub-alternatives you can consider.  The main thing is that typically, RTO/RPO are inversely proportional to costs.  So you can walk from one alternative to the other to change the RTO and / or RPO and / or costs until you find the right compromise.

Remember to first consider the risk of a service outage.  Depending on which environment you are coming from, Azure’s outage risk might not be a problem for your organization since they seldomly happen.