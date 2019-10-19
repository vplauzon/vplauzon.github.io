---
title:  Windows Azure Pack Preview
date:  2013-07-04 23:26:03 -04:00
permalink:  "/2013/07/04/windows-azure-pack-preview/"
categories:
- Solution
tags:  []
---
<p>Among the flurry of new features of Windows Server 2012 R2 is <a href="http://www.microsoft.com/en-us/server-cloud/windows-azure-pack.aspx">Windows Azure Pack</a> (WAP).
</p><p>I've read about that product but I didn't install it yet and therefore do not have hands-on experience yet.
</p><p>Microsoft positions this new offering within its <a href="http://www.microsoft.com/en-us/server-cloud/cloud-os/default.aspx"><em>Cloud OS </em>vision</a>:
</p><ul><li><em>Customer</em>, the consumer of cloud services in this <em>People Centric IT</em> vision
</li><li><em>Windows Azure</em>, Microsoft Public Cloud offering
</li><li><em>Service Provider</em>¸ third parties providing services in the cloud
</li></ul><p><img src="http://vincentlauzon.files.wordpress.com/2013/07/070513_0417_windowsazur1.png" alt="" />
	</p><p>Windows Azure Pack sits squarely between the last two:  it brings Windows Azure to Service Providers.
</p><p>WAP is part of Windows Server 2012 R2 System Center.  It <strong>doesn't involve additional cost</strong> and leverages <a href="http://technet.microsoft.com/en-us/library/gg610610.aspx">System Center Virtual Machine Manager</a> (VMM).  It is an on premise, private cloud system.
</p><p>
 </p><p>To me this is very exciting.
</p><p>For years we've heard about private cloud.  Until now the private cloud sat in the gap between public cloud offering (Windows Azure, Amazon, etc.) and virtualization platform (Microsoft Hyper-V, VMware).
</p><p>It was basically:  "take your favorite virtualization platform and build an entire self-provisioning system taking care of storing virtual images gallery, letting end-user provision their own workload, monitor, alert, bill, etc.".  I've seen companies taking up the challenge:  the cost were steep, the timeline delayed and the result disappointing.  They never reached fully self-provisioned state and never went beyond hosting virtual machines.
</p><p>In that WAP is a game changer.  It's your full Private Cloud solution on a CD.  Microsoft published a <a href="http://download.microsoft.com/download/0/1/C/01C728DF-B1DD-4A9E-AC5A-2C565AA37730/Windows_Azure_Pack_White_Paper.pdf">White Paper on WAP</a>.
</p><p>Here are the main parts of Windows Azure Pack:
</p><p><strong>Management portal for Tenants</strong>:  this is the on premise equivalent to the Windows Azure Developer portal.  The resemblance is quite striking:
</p><p><img src="http://vincentlauzon.files.wordpress.com/2013/07/070513_0417_windowsazur2.jpg" alt="" />
	</p><p>It allows customer to self-provision different workload (more on workload in a moment).  Once workloads are provisioned, customer can then manage and monitor it from that same portal.
</p><p><strong>Management Portal for Administrators</strong>:  this portal allows administrator to manage the entire Data Center with its different tenants.
</p><p><img src="http://vincentlauzon.files.wordpress.com/2013/07/070513_0417_windowsazur3.png" alt="" />
	</p><p><strong>Service Management API</strong>:  a set of REST Services giving programmatic access to the two portals.  For instance, a customer could provision a Virtual Machine using a Service API, bypassing the portal.  This allows for some original automation scenarios.
</p><p>
 </p><p>I've talked about workloads.  Here they are.  WAP sports a subset of the services available on Windows Azure, namely:
</p><ul><li>Web Sites
</li><li>Virtual Machines
</li><li>Service Bus
</li></ul><p>Those address popular scenarios.  Notably missing from that list:
</p><ul><li>Cloud Services, the original Windows Azure offering coming in Web and Worker role flavor.   It is said that Web Sites are implemented using Cloud Services in Windows Azure so there are good reasons to believe it is also the case on WAP.  If that's the case, Cloud Services are likely to surface in future releases.
</li><li>Virtual Network, which allows tenants in Windows Azure to bring Azure virtual machines on their network.  Although it isn't mentioned explicitly in the white paper, it seems to be on the tenant portal (see above).  Without Virtual Network, many Enterprise scenarios would be difficult to realize, leaving virtual machines in a foreign network.
</li><li>SQL Databases, one of the most popular features in Windows Azure.  Again, although not mentioned in the White Paper it is on the console's screen shot.  SQL Server is also a prerequisite for installing WAP since the portal uses SQL Server as a back-end store.
</li><li>Active Directory, Windows Azure integration to on premise Active Directory and claims based solution.  Without this, integration with customers' directory would be difficult again making certain Enterprise scenarios difficult.
</li></ul><p>Still, the 3 official workloads are quite a good start for a Private Cloud story.  <em>Virtual Machines</em> are certainly going to be the most popular at first while <em>Web sites</em> offer a more PaaS story for more scalable solutions and <em>Service Bus</em> offers a scalable message-based integration solution.
</p><p>
 </p><p>Now what is the operational model of WAP?
</p><p>Basically, WAP Admins creates plans.  A plan contains available services and quotas.  For instance, a <em>basic </em>plan could contain virtual machines with up to 5 VMs per tenant with a total of 500Gb of storage.
</p><p>Customers then subscribes to plans and provisions services within those plans.
</p><p>This is summarized in the following picture:
</p><p><img src="http://vincentlauzon.files.wordpress.com/2013/07/070513_0417_windowsazur4.png" alt="" />
	</p><p>This is a neat model since a Private cloud typically doesn't have infinite capacity.  The notion of quotas allows administrator to give sand boxes to customers where they can scale within manageable limits.  Plans could be adjusted on demand but via a manual process.
</p><p>
 </p><p><a href="http://www.hyper-v.nu/archives/author/marcve/">Marc van Eijk</a> posted a comprehensive guide on <a href="http://www.hyper-v.nu/archives/marcve/2013/02/installing-and-configuring-windows-azure-for-windows-server-part-1/">how to install WAP</a>.  It is interesting to note that WAP can be installed on a single server (for evaluation / POC purposes obviously).
</p><p>For me, WAP represents a breakthrough in the Private Cloud solutions and is a great opportunity for Service Providers and Enterprises alike.
</p><p>The preview was announced in July 2013 and general availability is planned, as the rest of Windows Server 2012 R2 for January 2014.</p>