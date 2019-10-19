---
title:  Azure Managed Disk–Overview
date:  2017-02-20 10:30:36 -05:00
permalink:  "/2017/02/20/azure-managed-disk-overview/"
categories:
- Solution
tags:
- Virtual Machines
---
<a href="assets/2017/2/azure-managed-disk-overview/pexels-photo-1965201.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="pexels-photo-196520[1]" src="assets/2017/2/azure-managed-disk-overview/pexels-photo-1965201_thumb.jpg" alt="pexels-photo-196520[1]" width="400" height="266" align="right" border="0" /></a>

Microsoft released Azure Managed disk 2 weeks ago.  Let’s look at it!

What did we have until then?  The virtual hard disk (.vhd file) was stored as a page blob in an Azure Storage account.

That worked quite fine and Azure Disks are a little more than that.  A little abstraction.  But at the same time, Azure now knows it’s a disk and can hence optimize for it.
<h2>Issues with unmanaged disks</h2>
That’s right, our good old page blob vhd is now an unmanaged disk.  This sounds like 2001 when Microsoft released .NET &amp; managed code and you learned that all the code you’ve been writing since then was <em>unmanaged</em>, <em>unruly!</em>

Let’s look at the different issues.

First that comes to mind is the <strong>Input / Output Operations per Seconds (IOPs)</strong>.  A storage account tops IOPS at 20000.  An unmanaged standard disk can have 500 IOPs.  That means that after 40 disks in a storage account, if we only have disks in there, we’ll start to get throttled.  This doesn’t sound too bad if we plan to run 2-3 VMs but for larger deployments, we need to be careful.  Of course, we could choose to put each VHD in different storage account but a subscription is limited to 100 storage accounts and also, it adds to management (managing the domain names &amp; access keys of 100 accounts for instance).

Another one is <strong>access rights</strong>.  If we put more than one disks in a storage account, we can’t give different access to different people to different disks:  if somebody is contributor on the storage account, he / she will have access to all disks in the account.

A painful one is around <strong>custom images</strong>.  Say we customize a Windows or Linux image and have our generalized VHD ready to fire up VMs.  That VHD needs to be in the same storage account than the VHD of the created VM.  That means you can only create 40 VMs really.  That’s where the limitation for VM scale set with custom images comes from.

A side effect of being in a storage account is the <strong>VHD is publicly accessible</strong>.  You still need a SAS token or an access key.  But that’s the thing.  For industries with strict regulations / compliances / audits, the ideas of saying “if somebody walked out with your access key, even if they got fired and their logins do not work anymore, they can now download and even change your VHD” is a deal breaker.

Finally, one that few people are aware of:  <strong>reliability</strong>.  Storage accounts are highly available and have 3 synchronous copies.  They have a <a href="https://azure.microsoft.com/en-us/support/legal/sla/storage/v1_1/" target="_blank">SLA of %99.9</a>.  The problem is when we match them with VMs.  We can setup high availability of a VM set by defining an <a href="https://vincentlauzon.com/2015/10/21/azure-basics-availability-sets/" target="_blank">availability set</a>:  this gives some guarantees on how your VMs are affected during planned / unplanned downtime.  Now 2 VMs can be set to be in two different failure domains, i.e. they are deployed on different hosts and don’t share any critical hardware (e.g. power supply, network switch, etc.) but…  their VHDs might be on the same storage stamp (or cluster).  So if a storage stamp goes down for some reason, two VMs with different failure / update domain could go down at the same time.  If those are our only two VMs in the availability set, the set goes down.
<h2>Managed Disks</h2>
Managed disks are simply page blobs stored in a Microsoft managed storage account.  On the surface, not much of a change, right?

Well…  let’s address each issues we’ve identified:
<ul>
 	<li>IOPS:  disks are assigned to different storage accounts in a way that we’ll never get throttled because of storage account.</li>
 	<li>Access Rights:  Managed disks are first class citizens in Azure.  That means they appear as an Azure Resource and can have RBAC permissions assigned to it.</li>
 	<li>Custom Image:  beside managed disks, we now have snapshots and images as first class citizens.  An image no longer belong to a storage account and this removes the constraint we have before.</li>
 	<li>Public Access:  disks aren’t publically accessible.  The only way to access them is via a SAS token.  This also means we do not need to invent a globally unique domain name.</li>
 	<li>Reliability:  when we associate a disk with a VM in an availability set, Azure makes sure that VMs in different failure domains aren’t on the same storage stamp.</li>
</ul>
<h2>Other differences</h2>
Beside the obvious advantages here is a list of differences from unmanaged disks:
<ul>
 	<li>Managed disks can be in both Premium &amp; Standard storage but only LRS</li>
 	<li>Standard Managed disks <a href="https://azure.microsoft.com/en-us/pricing/details/managed-disks/" target="_blank">are priced</a> given the closest pre-defined fix-sizes, not the “currently used # of GBs”</li>
 	<li>Standard Managed disks still price transactions</li>
</ul>
Also, quite importantly, Managed Disks do not support Storage Service Encryption at the time of this writing (February 2017).  It is supposed to come very soon though and Managed Disks do support encrypted disks.
<h2>Summary</h2>
Manage Disks bring a couple of goodies with them.  The most significant one is reliability, but other features will clearly make our lives easier.

In future articles, I’ll do a couple of hands on with Azure Managed Disks.