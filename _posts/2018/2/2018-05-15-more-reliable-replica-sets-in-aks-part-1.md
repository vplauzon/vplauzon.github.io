---
title: More reliable Replica Sets in AKS - Part 1
date: 2018-05-15 03:30:15 -07:00
permalink: /2018/05/15/more-reliable-replica-sets-in-aks-part-1/
categories:
- Solution
tags:
- Containers
---
<img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="lion-2449282_640" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/lion-2449282_640_thumb.jpg" alt="lion-2449282_640" width="320" height="213" align="right" border="0" />Availability is a core architecture attribute often sought after.

We’ve taken a look at <a href="https://vincentlauzon.com/2018/05/10/understanding-identities-in-azure-aks-kubernetes/">Azure Managed Kubernetes Cluster (AKS) here</a>.  In this article (part 1), we’re going to experiment and prove that replica set aren’t “highly available” by default.  In part 2 , we’re going to look at how to architect replica sets in Azure AKS in order to make them highly available.
<h2>High Availability in Azure</h2>
It is quite simple to implement High Availability (HA) in Azure.  Azure Availability Sets and Load Balancers are the main tools.  They ensure a set of VMs remains available (i.e. can process requests).  They guard against two types of event:
<ul>
 	<li>Hardware failures</li>
 	<li>Planned maintenance (software update in Azure infrastructure)</li>
</ul>
A prerequisite for this article is to understand Availability Sets.  Also, it is required to know what are Update &amp; Fault domains.  We discussed <a href="https://vincentlauzon.com/2015/10/21/azure-basics-availability-sets/">Availability Sets and those concepts here</a>.
<h2>High Availability of Replica Sets</h2>
At the time of this writing (end of April 2018), <a href="https://azure.microsoft.com/en-us/support/legal/sla/container-service/v1_0/">AKS has an SLA</a> based on its underlying virtual machines.  This means the cluster, as a whole, has an SLA.  That SLA won’t necessarily translate to a given replica set (group of containers).

Let’s look at an hypothetical AKS Cluster.  The cluster has 4 nodes.  It belongs to an Availability Set with 2 Fault Domains and 3 Update Domains:

<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image10.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image_thumb10.png" alt="image" border="0" /></a>

We see the availability set spreads the VMs on different domains.  It does it in such a way that if any of the Fault Domains would go down, there would be VMs left to take the load.  Similarly with Update Domains.  This is how Availability Sets enable High Availability at the VM level.

Now let’s look at replica sets deployed on that cluster:

<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image12.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image_thumb12.png" alt="image" border="0" /></a>

Replica Sets’ places pods on different cluster nodes (VMs).  We see the ‘triangle’ replica set is highly available:  no domain could take it all down by going down.  Similarly, the ‘circle’ replica set is highly available.  The ‘star’ replica set isn’t.  If Update Domain 2 would go down, it would take the 2 pods of the ‘star’ replica set.

Our experiments showed that replica sets seem to place pods on many fault domains.  They aren’t always placed on many update domains though.  This means that replica sets of 2 or more pods should be resilient to hardware failures.  But they won’t necessarily be resilient to <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/maintenance-and-updates">planned maintenance</a>.

We are going to show how to reproduce those results.
<h2>Why is this a big deal?</h2>
Kubernetes runtime is constantly monitoring to make sure to maintain target state.

When nodes go down Kubernetes would settle back to the desired state.  We could then dismiss the placement pattern issue.

So what is the big deal?

It is true that Kubernetes will try to bring back pods and will hence help to achieve high availability.  Nevertheless, we see two problems:
<ol>
 	<li>Although trivial containers deploy quickly, non-trivial pod can take a few seconds.  Some pods can even take a minute or two before their readiness probe clears them to receive requests.  During that time, service would be down.</li>
 	<li>A cluster being under CPU and/or memory pressure might not be able to reschedule pods when some nodes go down.  An entire service might then stay unavailable until nodes come back online.  In the worst case (reboot), this could take a few minutes.</li>
</ol>
We need to nuance this issue.

VMs routinely outperform the SLA guarantee.  Most planned maintenance are now <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/maintenance-and-updates#memory-preserving-maintenance">memory preserving</a>.  This mean only a brief pause is experienced in the VM execution.  Some still <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/maintenance-and-updates#maintenance-requiring-a-reboot">require a reboot of the guest VMs</a> though.

Adding to that, a replica set placed on a single update domain doesn’t occur all the time.  A lot of replica set spread pods across many domains.  When it does happen, it might not be a problem if the cluster has available resources and containers are quick to start.  But if the planets do not align, this could create an availability problem.
<h2>AKS availability set</h2>
When we create an AKS cluster, it creates VMs for us.  They are created as part of a single availability set.  We can see those “behind the scene” resources by looking at the paired resource group.  Here we created an AKS service named <em>aks2</em>.  It sits inside a resource group also named <em>aks2</em> in <em>Canada Central</em> Azure region.  The paired resource group is <em>MC_aks2_aks2_canadacentral</em>.

<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image7.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image_thumb7.png" alt="image" border="0" /></a>

We can open that resource group and look at the resources inside.  If we sort by type, <em>availability set</em> should come up on top.

<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image8.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image_thumb8.png" alt="image" border="0" /></a>

The overview of the availability set lists the VM members.  It also displays their fault and update domains.

<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image9.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-1/image_thumb9.png" alt="image" border="0" /></a>

Here we have a 20 nodes cluster (we didn’t display all VMs in the above image).  We can see that VMs are in both 0 and 1 failure domains and 0,1 &amp; 2 update domains.
<h2>Reproducing our experiment</h2>
In Kubernetes, a <em>replica set </em>is a group of <em>pods</em>.  A <em>pod</em> is a group of <em>containers</em>, although it often is a single <em>container</em>.  A <em>replica set</em> is often defined in a <em>deployment</em>, as we’ll do in our example.

A replica set defines a target state with a number of replicas.  Kubernetes runtime works to achieve that target state.  If a pod falls down (e.g. its host VM shuts down), it will deploy a new pod on another node.

Kubernetes sees Azure VMs as simple nodes.  It is agnostic of which update / failure domains each VM is on.  At least, as of this writing (end of April 2018).

It is quite easy to show.  Let’s do an experiment with our 20 nodes cluster.

We created the cluster with

```shell
az aks create --resource-group aks2 --name aks2 --kubernetes-version 1.9.6 --node-count 20 --generate-ssh-keys
```

Our code is <a href="https://github.com/vplauzon/containers/tree/master/replicasets-ha">available on GitHub</a>.

We start by creating a few deployments.  Each deploy one replica set.  Each replica set uses the same Docker Image:  <a href="https://hub.docker.com/r/vplauzon/get-started/tags/">vplauzon/get-started:part2-no-redis</a>.  We introduced that container in a <a href="https://vincentlauzon.com/2018/04/26/azure-container-instance-getting-started/">past article</a>.  It is a hello-world <a href="http://flask.pocoo.org/">Flask app</a> and consumes very little resources.  It won’t create memory or CPU pressure on the cluster.

We are going to run the following code in the shell (also available as a <a href="https://github.com/vplauzon/containers/blob/master/replicasets-ha/initial-create.sh">shell script here</a>):

```shell
kubectl create -f dep-a.yaml

kubectl create -f dep-b.yaml

kubectl create -f dep-c.yaml

kubectl create -f dep-d.yaml

kubectl create -f dep-e.yaml
```

We can then look at the pods placement by executing <em>kubectl get pods -o wide</em>.

Here we translate the results in terms of node update and fault domains:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Deployment</th>
<th>Fault Domains</th>
<th>Update Domains</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
<td>{1, 0, 0}</td>
<td>{2, 1, 1}</td>
</tr>
<tr>
<td>B</td>
<td>{1, 0}</td>
<td>{2, 0}</td>
</tr>
<tr>
<td>C</td>
<td>{1, 0}</td>
<td>{1, 0}</td>
</tr>
<tr>
<td>D</td>
<td>{1, 1, 0}</td>
<td>{1, 1, 2}</td>
</tr>
<tr>
<td>E</td>
<td>{1, 0}</td>
<td>{2, 2}</td>
</tr>
</tbody>
</table>
As we see, it does a pretty good job.  The only deployment having availability exposure is ‘E’.  Both pods land in the update domain ‘2’.

Pod placement is somehow randomize.  We chose that sequence of deployments as it often leads to the result we wanted to show.

An easy way to “reshuffle the deck” here is to delete the replica set ‘e’.  Kubernetes will recreate the replica set and place pods again.  We could also do that to see how frequent a non-HA configuration is.  Let’s run the following code:

```shell
kubectl delete rs -l app=app-e

watch kubectl get pods -o wide
```

If we do that 10 times on our 20 nodes cluster we get the following results:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Trial#</th>
<th>Fault Domains</th>
<th>Update Domains</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>{1,0}</td>
<td>{0,2}</td>
</tr>
<tr style="background:lime;">
<td>2</td>
<td>{1,0}</td>
<td><strong>{2,2}</strong></td>
</tr>
<tr style="background:lime;">
<td>3</td>
<td>{0,1}</td>
<td><strong>{0,0}</strong></td>
</tr>
<tr>
<td>4</td>
<td>{1,0}</td>
<td>{0,2}</td>
</tr>
<tr style="background:lime;">
<td>5</td>
<td>{1,0}</td>
<td><strong>{2,2}</strong></td>
</tr>
<tr style="background:lime;">
<td>6</td>
<td>{0,1}</td>
<td><strong>{0,0}</strong></td>
</tr>
<tr>
<td>7</td>
<td>{1,0}</td>
<td>{0,2}</td>
</tr>
<tr style="background:lime;">
<td>8</td>
<td>{1,0}</td>
<td><strong>{2,2}</strong></td>
</tr>
<tr style="background:lime;">
<td>9</td>
<td>{0,1}</td>
<td><strong>{0,0}</strong></td>
</tr>
<tr>
<td>10</td>
<td>{1,0}</td>
<td>{0,2}</td>
</tr>
</tbody>
</table>
There is a repeating pattern every three trials where the same nodes were selected.  2 out of the 3 placements landed on only one update domain.
<h2>Observations</h2>
We tried multiple times to create the same pattern for fault domains.  We deleted many replica sets.  Every time replica sets got placed on many fault domains.

That is beyond random possibility so we believe AKS does it on purpose.

On the other hand, it is quite easy to have a replica set landing on a single update domain.

As we’ll see in the next article, Kubernetes does have access to the fault domain index but not the update domain.  It is a <a href="https://kubernetes.io/docs/reference/labels-annotations-taints/#failure-domainbetakubernetesiozone">documented behaviour that Kubernetes spread pods on different “failure domains”</a>.
<h2>Summary</h2>
We have discussed the details of how Azure implements High Availability for VMs.  We also discussed how replica sets place pods on nodes to be highly available themselves.

We observed that some replica set aren’t resilient to Azure planned maintenance.  This is because they place their nodes on a single update domain.

In the next article, we’ll discuss how we can use Kubernetes to address that.