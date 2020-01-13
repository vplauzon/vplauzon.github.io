---
title: Disaster Recovery with VM Scale Sets & Geo-Replicated DBs
date: 2017-11-09 06:17:50 -08:00
permalink: /2017/11/09/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/
categories:
- Solution
tags:
- Data
- NoSQL
- Virtual Machines
---
<a href="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/train-wreck-steam-locomotive-locomotive-railway-738211.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="train-wreck-steam-locomotive-locomotive-railway-73821[1]" src="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/train-wreck-steam-locomotive-locomotive-railway-738211_thumb.jpg" alt="train-wreck-steam-locomotive-locomotive-railway-73821[1]" width="320" height="384" align="right" border="0" /></a><a href="https://vincentlauzon.com/2016/07/11/disaster-recovery-with-azure-virtual-machines/">Last year we posted an article</a> about different options available in Azure to implement a disaster recovery strategy.

We strongly suggest to review that article as it gives good insights about what a disaster recovery strategy is within an already resilient Cloud Environment but also clear out a few misconceptions people have around DR-capability of different services.

Those are general guidelines and we noticed in private conversation that people were left wondering about how to implement some of the strategies drafted in that article.

Today’s article will focus on a specific scenario and dive a little deeper.

The scenario is Virtual Machine Scale Sets (VMSS) with Geo-Replicated Databases, specifically Azure SQL and / or Azure Cosmos DB.

We made the scenario specific to avoid too much abstraction, but the same patterns can be applied to other use cases.

<h2>Regions</h2>

We are going to work with two <a href="https://azure.microsoft.com/en-us/regions/" target="_blank" rel="noopener">Azure regions</a>:  Primary and Secondary.

Primary region is the home region of our workload.  When the region becomes unable to run the workload, the workload is transferred to the Secondary Region.

The primary region might be unsuitable to run the workload for different reasons.  Typically, a Service outage, e.g. storage service is suffering an outage, will either partially or completely make the workload inoperable.  Another reason would be region lost.  This would happen if all data centers within a region would be lost, which hasn’t happened once yet (as of early November 2017).

<h2>Resource Groups</h2>

We are going to work with two resource groups:

<ul>
    <li>Permanent Resource Group</li>
    <li>Failover Resource Group</li>
</ul>

Our workload runs in the Permanent Resource Group while resources standing up during a failover only should be in the Failover Resource Group.

Failover Resource Group can be deleted once operations are back to the Primary Region.

That isn’t to say that the permanent resource group contains only resources from the Primary region as we’ll see later.  We could decide to stand up a few secondary region resources in advance as we’ll see below.

<h2>State</h2>

<a href="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/pexels-photo-1177291.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="pexels-photo-117729[1]" src="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/pexels-photo-1177291_thumb.jpg" alt="pexels-photo-117729[1]" width="320" height="213" align="left" border="0" /></a>Here it is important to come back to the concept of stateful and stateless compute we introduced in our <a href="https://vincentlauzon.com/2016/07/11/disaster-recovery-with-azure-virtual-machines/" target="_blank" rel="noopener">Disaster Recovery with Azure Virtual Machines</a> article.

Stateless compute doesn’t carry transactional state.  It will have state, e.g. VM disk, but that state won’t change as the workload runs and users interact with it.  It is immutable and hence is quite easy to scale out but also to transport to a different region.  VM Scale Sets sit squarely in that category.

Stateful compute does carry transactional state.  It is typically harder to scale out and to transport to a different region.  Databases are typical example of such compute.

Unfortunately, a lot of workload fall between those two categories.  For example, a lot of web servers are mostly stateless except they do persist files locally which aren’t merely cache.  Sometimes we can get around that state of affair, for instance by putting that state in an <a href="https://docs.microsoft.com/en-us/azure/storage/files/storage-files-introduction" target="_blank" rel="noopener">Azure Files</a> share thus making VMs stateless.

<h2>Failover Diagram</h2>

Given those two axis, i.e. regions (Primary &amp; Secondary) and resource groups (Permanent &amp; Failover), we can look at the failover strategy in terms of four quadrants as illustrated in the following diagram:

<a href="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/4/disaster-recovery-with-vm-scale-sets-geo-replicated-dbs/image_thumb.png" alt="image" border="0" /></a>

Our axis have two swim lanes each and their intersection form the four (4) quadrants.

The four quadrants can be used in a more general setting, but let’s focus on our specific use case here:  VMSS with SQL &amp; Cosmos DB.

In the top-left corner is our primary workload, i.e. permanent resources (i.e. within the Permanent Resource Group) within the Primary Region.

Here we have primary compute composed of VM Scale Sets.  We assume the Scale Sets are based on custom images ; if they are based on Azure Marketplace image, it is even easier.  The custom images are stored within the top-left quadrant.

In the top-right quadrant, we have resources we provision in advance (i.e. in the Permanent Resource Group) within the Secondary region.  For instance, we often provision the Networking in advance.

We store copies of VMSS custom images in the Secondary Region since the images in the Primary Region might not be accessible during failover.

In our case, we store all our state in Azure SQL and / or Azure Cosmos DB.  Both those databases offer geo-replication.  We provision the geo-replica in Secondary region.

In the bottom-right quadrant are the resources stood up at failover time, i.e. within the Failover Resource Group.  Here we typically have our Failover Compute.

It is a design choice to decide if the failover VMSS are provisioned in advance with zero instances or if they are provisioned only during failover time.  Either way, the actual instances, i.e. the underlying VMs, are provisioned during failover time.

The bottom-left quadrant is empty:  those would be Failover Resources within the Primary Region, which is a contradiction in term since the Primary Region is assumed offline during failover time.

<h2>Stateless transfer</h2>

Beside VMSS, other stateful compute can be considered:

<ul>
    <li>Networking components (Virtual Network, subnets, NSGs, etc.)</li>
    <li>Azure Application Gateway</li>
    <li>Redis Cache (typically cache isn’t persistent by definition)</li>
    <li>Virtual Machines not carrying transactional state</li>
    <li>Azure Batch</li>
    <li>etc.</li>
</ul>

This is the easiest and cheapest form of compute to transfer.  We simply need to “transfer the recipe”.  For instance, for a VMSS, we need to transfer the custom image and whatever script (e.g. DSC, Chef, Puppet, Ansible, etc.) it uses to spin up instances.

It only needs to be transfer when the configuration change.

<h2>Challenges with state</h2>

We use Azure SQL &amp; Azure Cosmos DB in our scenario because both support geo-replication.

Many Azure stateful resources aren’t so easy to replicate across regions.  For instance, Azure SQL Data Warehouse doesn’t support geo replication.  DW sometimes can be rebuilt from other transactional sources, but not always.  Even if they can, that can often take too much time, due to the volume of data, for a failover purpose.

Azure File Service doesn’t support Azure Storage Geo Replication.  <a href="https://docs.microsoft.com/en-us/azure/storage/files/storage-sync-files-planning" target="_blank" rel="noopener">Azure File Sync</a> will eventually support replication between two regions but doesn’t yet (as of November 2017).

Azure Blob Storage supports Geo-Replication but doesn’t support failover (unless the Primary region is declared lost, which never happened yet).  We could use read-only geo-replication and “manually” (via scripts) replicate the data to a Secondary Storage account either at regular interval or during failover (depending on the size of the data).  But that would require some scripting.

<a href="https://docs.microsoft.com/en-us/azure/mysql/overview" target="_blank" rel="noopener">MySQL</a> &amp; <a href="https://docs.microsoft.com/en-us/azure/postgresql/overview" target="_blank" rel="noopener">PostgreSQL</a> as a Service do not support geo-replication yet (as of November 2017).

The list goes on.

<a href="https://docs.microsoft.com/en-us/azure/site-recovery/concepts-azure-to-azure-architecture" target="_blank" rel="noopener">Azure Site Recovery (Azure to Azure)</a> can be used to replicate VMs and is the go-to solution for easily replicate VM workloads.

<h2>DR Procedure</h2>

Let’s assume we have a pure architecture with stateless VMSS &amp; Geo-replicated SQL &amp; Cosmos DB.  Then the failover procedure is quite simple:

<ol>
    <li>In parallel
<ul>
    <li>Failover data replicas</li>
    <li>Provision Failover Resource Group</li>
</ul>
</li>
    <li>Failover the DNS resolution to point to Secondary Region deployment</li>
</ol>

We can see that with this flexible architecture, a failover is quite simple.

Of course, it requires a lot of automation, which is where most of the effort will go.

The failover configuration should link resources together.  For example, Secondary Region VMSS should point to Secondary Region DB replica.

Failback procedure is also simple:

<ol>
    <li>Shutdown applications so that no more data get changed</li>
    <li>Failover data replicas back to Primary Region</li>
    <li>Fail back the DNS resolution to point to Primary Region deployment</li>
    <li>Delete the <i>Failover</i> resource group and its compute</li>
</ol>

During a failover, a failure occur and potentially some data is lost.  During a failback, we control the timing and this is why we add the first step, i.e. stopping data modification (and hence data loss while we failover) by shutting down applications.

<h2>Summary</h2>

We looked more concretely at how we would failover a workload of stateless VMSS with stateful Azure SQL &amp; Cosmos DB.

Most of the patterns here can be extended with other workloads.

For instance, stateful VMs could be added to this architecture and would follow the same path as the databases.  Instead of using geo-replication, we would use Azure Site Recovery (ASR).