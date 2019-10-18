---
title:  5 reasons to use Helm charts in Kubernetes
date:  2018-10-24 10:30:15 +00:00
permalink:  "/2018/10/24/5-reasons-to-use-helm-charts-in-kubernetes/"
categories:
- Solution
tags:
- Containers
- DevOps
---
<img style="float:left;padding-right:20px;" title="From leeroy on www.lifeofpix.com" src="https://vincentlauzon.files.wordpress.com/2018/10/life-of-pix-free-stock-boat-bar-wood-leeroy-e1539804294819.jpg" />

Kubernetes is a big platform to absorb.  It has a rich resource &amp; networking  model.  In many ways it is a miniature version of a fully fledge cloud provider, abstracting the underlying cloud provider.

That is my excuse for postponing addressing <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm">Helm</a> for such a long time.  Until today.

I'll look at why you should use it to install third party solutions, but also to package and deploy your own custom built solutions.

Without further ado, let's look at five (5) reasons why you want to use Helm charts in Kubernetes.

<h2>Easy way to install third party solutions</h2>

<img style="float:right;padding-right:20px;" title="From www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/10/box-celebration-gift-260184-e1539804683206.jpg" />

Helm is Kubernetes equivalent to Linux Apt-Get / Yum:  a packaging tool.

This might sound a little odd:  aren't containers the packaging unit?

Containers are a wonderful at packaging runtime environments in order to run one or few processes in isolation.

A Kubernetes solution is typically composed of more than a container.  For instance, it can be composed of:

<ul>
<li>Load balanced pods having one or more containers in them</li>
<li>Multiple sets of pods</li>
<li>Networking (e.g. <a href="https://vincentlauzon.com/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/">Ingress</a>)</li>
<li>Scheduled jobs</li>
<li>etc.</li>
</ul>

It is therefore a no-brainer to use a packaging solution to manage all those resources as a single unit.

As with other packaging solution, Helm allows us to manage a package as one thing instead of its many parts we often won't have the knowledge to manage.

Helm also allows to manage the lifetime of those components as a whole.  Tracking which components to delete vs update during an upgrade is therefore trivial.

<h2>Managing multiple resources</h2>

<img style="float:left;padding-right:20px;" title="From www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/10/art-arts-and-crafts-assorted-1331705-e1539805005525.jpg" />

Software engineering really consist of an handful of patterns.  For instance, "Add a level of indirection" is responsible for a myriad of different solutions such as programming language, network protocols, etc.  .

Another of those key patterns is composition.  The power of composition cannot be overestimated.  It is what allow us to handle complexity by breaking it down into smaller and smaller pieces until the individual piece can be reasoned about.

Helm gives us an intermediate level of components.  A big cluster (i.e. ~100 nodes) can run hundreds of containers.  If we only had two levels, i.e. the cluster and the hundreds of components, the workload would get out of hands quickly.

An Helm chart aggregates multiple Kubernetes resources.  It can also depend on more charts so we can have a hierarchy of packages.

This gives us a macro view of a cluster.  That is a level between the cluster itself and the single components running on it.

<h2>Atomically installing / upgrading / deleting multiple resources</h2>

<img style="float:right;padding-right:20px;" title="From www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/10/atom-1013638_640-e1539805411548.jpg" />

Installing a complex solution would require us to deploy multiple resources.

This would likely require an install document to follow.

Upgrades would be even more challenging.  Depending on the original and target version of the solution, we would have different operations to perform, e.g. deleting deprecated resources.

Finally, deleting a solution and making sure that no orphan resources are left behind can be challenging on a cluster running multiple solutions and hundreds of resources.

Helm charts allows us to manage the lifecycle of releases as units.

<h2>Versioning</h2>

Helm allows us to version releases within a cluster.

We can therefore bind our CI / CD releases with Helm release <em>revisions</em>.

It is easy to see what versions of a charts are running on a cluster.

<h2>Parametrized deployments</h2>

<img style="float:left;padding-right:20px;" title="From www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/10/equalizer-2935455_640-e1539805750708.png" />

Here is what we consider a killer feature for Dev Ops.

A typical task in Dev Ops is to reuse components to deploy to different environments.  For instance, we would like to deploy the same containers in dev &amp; production, but probably register them on different domain names and pointing to different external services (e.g. databases).

Kubernetes yaml specs files do not have a parameter concept.  We can cobble one together, typically by doing token replacement.  This has limitations and doesn't scale very well.

Helm solves this issue beautifully with its template system and <em>values</em> file.

It becomes easy to reuse the same charts to deploy to different environment or even different solutions.

<h2>Summary</h2>

Here were 5 quick reasons on why you should use Helm with both third party and home-grown solutions.

Helm allows us to manage complex solutions as units.  Those units (i.e. Helm Releases) can be parametrized and versioned.  Their lifecycle can be managed as units.

This gives us the ability to scale operations on a cluster.

<strong>Update (07-11-2017)</strong>:  See <a href="https://vincentlauzon.com/2018/10/31/authoring-a-helm-chart-on-kubernetes-aks-getting-started/">Authoring a Helm Chart on Kubernetes / AKS – Getting started</a> on how to author Helm Charts.