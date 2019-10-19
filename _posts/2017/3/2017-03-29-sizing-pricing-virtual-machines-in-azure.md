---
title:  Sizing & Pricing Virtual Machines in Azure
date:  2017-03-29 12:09:54 -04:00
permalink:  "/2017/03/29/sizing-pricing-virtual-machines-in-azure/"
categories:
- Solution
tags:
- Virtual Machines
---
<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/dog-1966394_6402.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;margin:0 30px 0 0;display:inline;padding-right:0;border-width:0;" title="Blue great dane puppy" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/dog-1966394_640_thumb2.jpg" alt="https://pixabay.com/en/dog-dog-breed-large-puppy-1966394/" width="315" height="315" align="left" border="0" /></a>I’m recurrently asked by customers similar questions around sizing &amp; pricing of Virtual Machines (VMs), storage, etc. .  So I thought I would do a reusable asset in the form of this article.

This is especially important if you are trying to size / price VMs “in advance”.  For instance if you are quoting some work in a “fixed bid” context, i.e. you need to provide the Azure cost before you wrote a single line of code of your application.

If that isn’t your case, you can simply trial different VM sizes.  The article would still be useful to see what variables you should be looking at if you do not obtain the right performance.

There are a few things to look for.  We tend to focus on the CPU &amp; RAM but that’s only part of the equation.  The storage &amp; performance target will often drive the choice of VM.

A VM has the following characteristics:  # cores, RAM, Local Disk, # data disks, IOPs, # NICs &amp; Network bandwidth.  We need to consider all of those before choosing a VM.

For starter, we need to understand that Virtual Machines cannot be “hand crafted”, i.e. we cannot choose CPU speed, RAM &amp; IOPS separately.  They come in predefined packages with predefined specs:  SKUs, e.g. D2.

Because of that, we might often have to oversize a characteristic (e.g. # cores) in order to get the right amount of another characteristic (e.g. RAM).

SKUs come in families called <em>Series</em>.  At the time of this writing Azure has the following VM series:
<ul>
 	<li>A</li>
 	<li>Av2 (A version 2)</li>
 	<li>D &amp; DS</li>
 	<li>Dv2 &amp; DSv2 (D version 2 &amp; DS version 2)</li>
 	<li>F &amp; FS</li>
 	<li>G &amp; GS</li>
 	<li>H &amp; HS</li>
 	<li>L &amp; LS</li>
 	<li>NC</li>
 	<li>NV</li>
</ul>
Each series will optimize different ratios.  For instance, the F Series will have a higher cores / RAM ratio than the D series.  So if we are looking at a lot of cores and not much RAM, the F series is likely a better choice than D series and will not force us to oversize the RAM as much in order to have the right # of cores.

For pricing, the obvious starting point is the pricing page for VM:  <a title="https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/" href="https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/">https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/</a>.
<h2>Cores</h2>
Azure compute allocates virtual core from the physical host to the VMs.

Azure cores are dedicated cores.  As of the time of this writing, there is no shared core (except for A0 VM) and there are no hyper threading.
<h2>Operating System</h2>
There are two components in the price of a VM:
<ol>
 	<li>Compute (the raw underlying VM, i.e. the CPU + RAM + local disk)</li>
 	<li>Licensed software running on it (e.g. Windows, SQL, RHEL, etc.)</li>
</ol>
The compute price corresponds to the CentOS Linux pricing since CentOS is open source and has no license fee.

Azure has different flavours of licensed software (as of the writing of this article, i.e. March 2017):
<ul>
 	<li>Windows
<ul>
 	<li>BizTalk</li>
 	<li>Oracle Java</li>
 	<li>SharePoint</li>
 	<li>SQL Server</li>
</ul>
</li>
 	<li>Linux
<ul>
 	<li>Open Source (no License)</li>
 	<li>Licensed:  Red Hat Enterprise License (RHEL), R Server, SUSE</li>
</ul>
</li>
</ul>
Windows by itself comes with the same license fee regardless of Windows version (e.g. Windows 2012 &amp; Windows 2016 have the same license fee).

Windows software (e.g. BizTalk) will come with software license (e.g. BizTalk) + OS license.  This is reflected in the pricing columns.  For instance, for BizTalk Enterprise (<a title="https://azure.microsoft.com/en-us/pricing/details/virtual-machines/biztalk-enterprise/" href="https://azure.microsoft.com/en-us/pricing/details/virtual-machines/biztalk-enterprise/">https://azure.microsoft.com/en-us/pricing/details/virtual-machines/biztalk-enterprise/</a>), here in Canadian dollars in Canada East region for the F Series:

<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image_thumb.png" alt="image" border="0" /></a>

In the OS column is the price of the compute + the Windows license while in the “Software” column is the price of the BizTalk Enterprise license.  The total is what we pay per hour for the VM.

It is possible to “Bring Your Own License” (BYOL) of any software (including Windows or Linux) in Azure and therefore pay only for the bare compute (which, again, correspond to CentOS Linux pricing).

<strong>UPDATE</strong>:  Through <a href="https://azure.microsoft.com/en-us/pricing/hybrid-use-benefit/">Azure Hybrid Use Benefit</a>, we can even "reuse" an on premise Windows license for a new (unrelated) VM in Azure.

We can also run whatever licensed software we want on top of a VM.  We can install SAP, get an SAP license and be %100 legal.  The licensed software I enumerated come with the option of being integrated in the “per minute” cost.

So one of the first decision to do in pricing is:  do we want to go with integrated pricing or external licensed based pricing?  Quite easy to decide:  simply look at the price of external licenses (e.g. volume licensing) we can have with the vendor and compare.

Typically if we run the VM sporadically, i.e. few hours per day, it is cheaper to go with the integrated pricing.  Also, I see a lot of customer starting with integrated pricing for POCs, run it for a while and optimize pricing later.
<h2>Temporary Disk</h2>
<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/footprint-93482_640.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="footprint-93482_640" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/footprint-93482_640_thumb.jpg" alt="footprint-93482_640" align="right" border="0" /></a>Ok, here, let’s debunk what probably takes 2 hours from me every single week:  the “disk size” column in the pricing sheets.

<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image_thumb1.png" alt="image" border="0" /></a>

This is <strong>local storage</strong>.  By local, we mean it’s local to the host itself, it isn’t an attached disk.  For that reason it has lower latency than attached disks.  It has also another very important characteristic:  <strong>it is ephemeral</strong>.  <strong>It isn’t persistent</strong>.  <strong>Its content does not survive a reboot of the VM</strong>.  <strong>The disk is empty after reboot</strong>.

We are insisting on this point because everybody gets confused on that column and for a good reason:  <strong>the column title is bunker</strong>.  It doesn’t lie, it is a disk and it does have the specified size.  But it is a <strong>temporary disk</strong>.

Can we install the OS on that disk?  <strong>No</strong>.  Note, we didn’t say “we shouldn’t”, but “we can’t”.

What we typically put on that disk is:
<ul>
 	<li>Page file</li>
 	<li>Temporary files (e.g. tempdb for SQL Server running on VM)</li>
 	<li>Caching files</li>
</ul>
Some VM series have quite large temporary disk.  Take for instance the L series:

<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image_thumb2.png" alt="image" border="0" /></a>

That VM series was specifically designed to work with Big Data workload where data is replicated within a cluster (e.g. Hadoop, Cassandra, etc.).  Disk latency is key but not durability since the data is replicated around.

Unless you run such a workload, don’t rely on the temporary disk too much.

The major consequence here is:  add attached disks to your pricing.  See <a title="https://azure.microsoft.com/en-us/pricing/details/managed-disks/" href="https://azure.microsoft.com/en-us/pricing/details/managed-disks/">https://azure.microsoft.com/en-us/pricing/details/managed-disks/</a>.
<h2>Storage Space</h2>
<img style="background-image:none;float:left;padding-top:0;padding-left:0;margin:0 10px 0 0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/icons8/ios7/128/Network-Cloud-Storage-icon.png" align="left" border="0" />The pricing page is nice but to have a deeper conversation we’ll need to look at more VM specs.  We start our journey at <a title="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes" href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes</a>.  From there, depending on the “type” of VM we are interested in, we’re going to dive into one of the links, e.g. <a title="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general" href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general</a>.

The documentation repeats the specs we see on the pricing page, i.e. # of cores, RAM &amp; local disk size, but also gives other specs:  max number of data disks, throughput, max number of NICs and network bandwidth.  Here we’ll focus on the maximum number of data disks.

A VM comes with an OS disk, a local disk and a set of optional data disks.  Depending on the VM SKU, the maximum number of data disks does vary.

At the time of this writing, the maximum size of a disk on a VM is 1TB.  We can have bigger <em>volumes</em> on the VM by stripping multiple disks together on the VM’s OS.  But the biggest disk is 1TB.

For instance, a D1v2 (see <a title="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dv2-series" href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dv2-series">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dv2-series</a>) can have 2 data disks on top of the OS disk.  That means, if we max out each of the 3 disks, 3 TB, including the space for the OS.

So what if the D1v2 really is enough for our need in terms of # of cores and RAM but we need 4 TB of storage space?  Well, we’ll need to bump up to another VM SKU, a D2v2 for instance, which supports 4 data disks.
<h2>Attached Disks</h2>
<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/night-computer-hdd-hard-drive.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="night-computer-hdd-hard-drive" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/night-computer-hdd-hard-drive_thumb.jpg" alt="night-computer-hdd-hard-drive" width="240" height="159" align="right" border="0" /></a>Beside the temporary disk all VM disks have attached disks.

Attached means they aren’t local to the VM’s host.  They are attached to the VM and backed by Azure storage.

Azure storage means 3 times synchronous replica, i.e. <strong>high resilience, highly persistence</strong>.

The Azure storage is its own complex topic with many variables, e.g. LRS / GRS / RA-RGS, Premium / Standard, Cool / Hot, etc.  .

Here we’ll discuss two dimensions:  Premium vs Standard &amp; Managed vs Unmanaged disks.

We’ve explained what managed disks are in contrast with unmanaged disk in <a href="https://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">this article</a>.  Going forward I recommend only managed disks.

Standard disks are backed by spinning physical disks while Premium disks are backed by Solid State Drive (SSD) disks.  In general:
<ul>
 	<li>Premium disk has higher IOPs than Standard disk</li>
 	<li>Premium disk has more consistent IOPs than Standard disk (Standard disk IOPs will vary)</li>
 	<li>Premium disk is has higher availability (see <a href="https://vincentlauzon.com/2016/11/23/single-vm-sla/">Single VM SLA</a>)</li>
 	<li>Premium disk is more expensive than Standard disk</li>
</ul>
So really, only the price will stop us from only using Premium disk.

In general:  IO intensive workloads (e.g. databases) should always be on premium.  Single VM need to be on Premium in order to have an SLA (again, see <a href="https://vincentlauzon.com/2016/11/23/single-vm-sla/">Single VM SLA</a>).

For the pricing of disks, see <a title="https://azure.microsoft.com/en-us/pricing/details/managed-disks/" href="https://azure.microsoft.com/en-us/pricing/details/managed-disks/">https://azure.microsoft.com/en-us/pricing/details/managed-disks/</a>.  Disks come in predefined sizes.
<h2>IOPs</h2>
<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/speed-1249610_640.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="speed-1249610_640" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/speed-1249610_640_thumb.jpg" alt="speed-1249610_640" align="left" border="0" /></a>We have our VM, the OS on it, we have the storage space but are the disks going to perform?

This is where the Input / Ouput per seconds (IOPs) come into the picture.

An IO intensive workload (e.g. database) will consume IOPs from the VM disks.

Each disk come with a number of IOPs.  In the pricing page (<a title="https://azure.microsoft.com/en-us/pricing/details/managed-disks/" href="https://azure.microsoft.com/en-us/pricing/details/managed-disks/">https://azure.microsoft.com/en-us/pricing/details/managed-disks/</a>), the Premium disks, i.e. P10, P20 &amp; P30, have documented IOPs of 500, 2300 &amp; 5000 respectively.  Standard disks (at the time of this writing, March 2017), do not have IOPs documented but it is easy to find out by creating disks in the portal ; for instance an S4 disk with 32 GB will have 500 IOPs &amp; 60 MB/s throughput.

In order to get the total number of IOPs we need, we’ll simply select a set of disks that has the right total of IOPs.  For instance, for 20000 IOPs, we might choose 4 x P30, which we might expose to the OS as a single volume (by stripping the disks) or not.  Again, we might need to oversize here.  For instance, we might need 20000 IOPs for a database of only 1TB but 4 x P30 will give us 4 TB of space.

Is that all?  Well, no.  Now that we have the IOPs we need, we have to make sure the VM can use those IOPs.  Let’s take the DSv2 series as an example (see <a title="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dsv2-series" href="https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dsv2-series">https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-windows-sizes-general#dsv2-series</a>).  A DS2v2 can have 4 data disks and can therefore accommodate our 4 x P3 disks, but it can only pull 8000 IOPs.  In order to get the full 20000 IOPs, we would need to oversize to a DS4v2.

<a href="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2017/3/sizing-pricing-virtual-machines-in-azure/image_thumb3.png" alt="image" border="0" /></a>

One last thing about IOPs:  what is it with those two columns cached / uncached disks?

When we attach a disk, we can choose from different caching options:  none, read-only &amp; read-write.  Caching uses a part of the host resources to cache the disks’ content which obviously accelerate operations.
<h2>Network bandwidth</h2>
A VM SKU also controls the network bandwidth of the VM.

There are no precisely documented bandwidth nor SLAs.  Instead, categories are used:  Low, Moderate, High and Very High.  The network bandwidth capacity increases along those categories.

Again, we might need to oversize a VM in order to access higher network throughput if required.
<h2>Network Interface Controller (NIC)</h2>
Finally, each VM SKU sports a different maximum number of Network Interface Controllers (NICs).

Typically a VM is fine with one NIC.  Network appliances (e.g. virtual firewalls) will often require 2 NICs.
<h2>Summary</h2>
There are a few variables to consider when sizing a VM.  The number of cores &amp; RAM is a good starting point but you might need to oversize the VMs to satisfy other characteristics such as storage space, disk performance or network performance.