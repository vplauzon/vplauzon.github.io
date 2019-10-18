---
title:  Azure Basics:  Premium Storage
date:  10/25/2015 23:00:07
permalink:  "/2015/10/25/azure-basics-premium-storage/"
categories:
- Solution
tags:  []
---
I thought I would do a lap around <a href="https://azure.microsoft.com/en-us/services/storage/premium-storage/" target="_blank">Azure Premium Storage</a> to clear some fog.

Premium storage is Solid State Drive (SSD) backed storage.  That means more expensive but mostly faster storage.

You might have heard the numbers?
<ul>
	<li>Up to 64 TB of SSD storage attached to a VM</li>
	<li>Up to 80K IOPS per VM</li>
	<li>Up to 2000M per second of throughput</li>
</ul>
Now, like everything related to high performance, there are a few variables to consider to get the most pert out of the service.  This is what I'm going to talk about here.
<h3>Premium storage vs D Series</h3>
<a href="https://vincentlauzon.files.wordpress.com/2015/10/ssd-drive-icon1.png"><img class=" wp-image-1316 alignleft" src="https://vincentlauzon.files.wordpress.com/2015/10/ssd-drive-icon1.png" alt="SSD-Drive-icon[1]" width="265" height="265" /></a>First thing to clear out, Premium storage isn't directly related to D Series and vis versa.

The <a href="https://azure.microsoft.com/en-us/blog/new-d-series-virtual-machine-sizes/" target="_blank">D Series VMs</a> are big ass VMs optimized for heavy CPU load.  They have huge amount of memory and to complement that, they have local SSD storage for <em>scratch space</em>.

That means the local SSD is a <strong>temp storage</strong>.  When the VM gets shut down (because you requested to, because there was a planned maintenance or because there was some physical failures), the content of local SSD is gone.

So don't put anything you cannot lose there.

That being said, D Series are very handy VMs.  Like all VM models they take minutes to setup.

I used them at a customer engagement to spun a database used to migrate 2 databases in one.  The team was trying to run the migration scripts (once off scripts not optimized for performance and running on million records tables) for weeks on laptops and normal VMs without success.  With a D series VM, we put the database on the scratch disk and the scripts ran at acceptable speed.  We didn't care to lose the DB content on reboot since that was copy of data anyway.
<h3>Couple of limitations</h3>
To use Premium Storage, you need to create a Premium Storage account.  You cannot just create a Premium Storage container within your existing account.

This comes with a few limitations:
<ul>
	<li>Currently (as of October 2015), not every region support Premium Storage.  See the <a href="http://azure.microsoft.com/regions/#services" target="_blank">details here</a>.</li>
	<li>You need to use the Preview Portal to manage the account</li>
	<li>Only page blobs are supported in Premium Storage Account.  The service is geared to serve VM vhds basically.</li>
	<li>Premium Storage Accounts do not support Geo-replication.  They are locally replicated (3 times) though.  If you want to have your data geo-replicated, you need to copy it to a normal storage account which can then be configured to be geo replicated.</li>
	<li>For VM disks (the main scenario for Premium Storage), you need to use <a href="https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-size-specs/" target="_blank">DS or GS series VMs</a>.</li>
	<li>No storage analytics &amp; no custom domain name.</li>
</ul>
<h3>Summary</h3>
There is more to it than that and <a href="https://github.com/tamram" target="_blank">Tamar Myers</a> wrote a thorough <a href="https://azure.microsoft.com/en-us/documentation/articles/storage-premium-storage-preview-portal/" target="_blank">guide on Premium Storage here</a>.

The main confusion typically is between local SSD storage and Premium Storage.  Premium Storage is external to VMs and 3-times replicated.  Local SSD is used either for caching or as local temp drive.