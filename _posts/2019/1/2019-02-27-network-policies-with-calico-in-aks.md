---
title: Network Policies with Calico in AKS
date: 2019-02-27 03:30:49 -08:00
permalink: /2019/02/27/network-policies-with-calico-in-aks/
categories:
- Solution
tags:
- Containers
- Identity
- Networking
---
<img style="float:right;padding-right:20px;" title="From pexels.com" src="/assets/posts/2019/1/network-policies-with-calico-in-aks/barrier-blur-chain-link-fence-1674819-e1550525929813.jpg" />

Calico network plugin is finally supported within Azure Kubernetes Services (AKS).

There is a very good <a href="https://docs.microsoft.com/en-us/azure/aks/use-network-policies">tutorial on the online documentation</a>, so we won't give a walkthrough here.

Instead we will highlight a couple of points about Network Policies in general and in AKS.

<h2>Online references</h2>

On top of the aforementioned <a href="https://docs.microsoft.com/en-us/azure/aks/use-network-policies">AKS tutorial</a>, we recommend reading Kubernetes online documentation to become more familiar with the concepts:

<ul>
<li><a href="https://kubernetes.io/docs/concepts/services-networking/network-policies/">Network Policies</a></li>
<li><a href="https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/">Declare Network Policy</a></li>
</ul>

There is a good <a href="https://github.com/ahmetb/kubernetes-network-policy-recipes">recipes repo</a> authored by <a href="https://github.com/ahmetb">Ahmet Alp Balkan</a>.  Ahmet also reference a <a href="https://www.youtube.com/watch?v=3gGpMmYeEO8">great Kubecon video</a> he did.  Unfortunately, most of his repo and that video are more than 12 months old which is an eternity in Kubernetes time.  For instance, one of the limitations he mentions, i.e. we can't discriminate traffic both coming from a namespace and a pod-selector aren't true anymore.  That is actually done in the <a href="https://docs.microsoft.com/en-us/azure/aks/use-network-policies#allow-traffic-only-from-within-a-defined-namespace">AKS tutorial</a>.

<h2>AKS enabling</h2>

At the time of this writing (mid February 2019), Calico is enabled at <a href="https://docs.microsoft.com/en-us/azure/aks/use-network-policies#create-an-aks-cluster-and-enable-network-policy">cluster creation time only</a>.

It is important to specify a recent Kubernetes version (e.g. 1.12.&#042;).  By default, at the time of this writing, the Azure CLI defaults to 1.9.&#042; which supported network policies, but more recent versions have support for more complex policies.  For instance, the online AKS tutorial doesn't work in 1.9.&#042;.

<h2>Network Policies can be...  hard to figure out</h2>

Some design characteristics make Network Policies a little hard to predict at time.

Let's look at some of them.

<h3>Network Policies need a network plugin</h3>

We can deploy as many network policies at a cluster as we want, if there are no plugin enabled, <a href="https://kubernetes.io/docs/concepts/services-networking/network-policies/#prerequisites">they won't have any effect</a>.

That is a little confusing, but in line with <a href="https://vincentlauzon.com/2018/11/21/understanding-simple-http-ingress-in-aks/">Ingress / Ingress Controller</a> behaviours.

<h3>Allow all / Deny all by default</h3>

Network Policies have some interesting defaults.

Until a pod is selected by a Network Policy, all traffic in / out is allowed.

When a pod is selected, then all traffic in is denied until explicitly allowed by a policy.

Then Network Policies are scoped by namespace, i.e. we apply policies one namespace at a time.

This flip of default behaviour often cause confusion when reading a collection of policies and trying to figure out what effect they could have.

<h3>Namespace label</h3>

If we want to discriminate on namespaces, e.g. pods in namespace A can't talk to pods in namespace B, we need selectors on namespaces' labels.

Namespaces, as any other Kubernetes resources, can have labels.  Typically, namespaces aren't labelled though.

<h2>Network Policies or authentication?</h2>

What is the control plane?  The network or the identity?

The legacy enterprise model favours the network.  The cloud typically favours identity but allows the network more and more.

Instead of seeing those two as opposing sides, we can see them as different layers of defense.

There are many cases where the network won't be enough.  For instance, if a pod is talking to an Azure SQL DB, we can't simply use networking to protect DB access.  Since Azure SQL us outside AKS Cluster, we can't use Network Policies.  We can use <a href="https://vincentlauzon.com/2017/10/04/virtual-network-service-endpoint-hello-world/">Service Endpoint</a> with Azure SQL to only allow AKS to access the DB.  This reduces the attack surface drastically.  We can then use <a href="https://vincentlauzon.com/2019/02/19/azure-ad-pod-identity-in-aks/">Pod Identity</a> to then discriminate which pod can have access to the database.

But identity can complement (and often replace) network even within an AKS cluster.  Identity can be a fail safe if a Network Policy wasn't applied or if a flaw in the policy allowed traffic that shouldn't be allowed.

<h2>Summary</h2>

We quickly look at Network Policies with Calico in AKS.

We suggest caution as Network Policies aren't trivial to understand / predict.

They do offer a good access control layer.

We recommend supplementing that access control layer with an authentication / authorization layer leveraging <a href="https://vincentlauzon.com/2019/02/19/azure-ad-pod-identity-in-aks/">Pod Identity</a>.