---
title: AKS with Kubenet vs Azure Networking plug-in
date: 2018-09-06 03:30:01 -07:00
permalink: /2018/09/06/aks-with-kubenet-vs-azure-networking-plug-in/
categories:
- Solution
tags:
- Containers
- Networking
---
<strong>Update (22-03-2019):  This configuration is now <a href="https://docs.microsoft.com/en-us/azure/aks/configure-kubenet">officially documented</a>.</strong>

<img style="float:left;padding-right:20px;" title="From Pexels" src="/assets/posts/2018/3/aks-with-kubenet-vs-azure-networking-plug-in/daylight-forest-glossy-443446-e1535661094739.jpg" />

I've been diving into Kubernetes / AKS Networking lately.  I thought I would share some of the insights I stumble upon.

We know AKS has two types of networking, basic &amp; <a href="https://docs.microsoft.com/en-us/azure/aks/networking-overview">advanced</a>, right?

<ul>
<li>Basic provisions its own VNET and exposes only public IPs</li>
<li>Advanced uses an existing VNET and exposes private IPs</li>
</ul>

For the latter, check <a href="http://vincentlauzon.com/2018/08/28/deploying-aks-with-arm-template-network-integration/">our last article</a> where we deploy advanced networking using ARM Template.

It turns out it's more subtle than that.

AKS' Basic &amp; Advanced networking are aggregation of Kubernetes' concepts.

We can even have an "in between" the two configurations.  The AKS cluster is deployed in an existing VNET but using cluster-IPs instead of VNET IPs for pods.

In this article we explore the two network plugins:

<ul>
<li>Kubenet network plugin (basic)</li>
<li>Azure network plugin (advanced)</li>
</ul>

As usual, the code used here is available in <a href="https://github.com/vplauzon/aks/tree/master/aks-kubenet">GitHub</a>.

To simplify the discussion, we assume we deploy services using <a href="https://kubernetes.io/docs/concepts/services-networking/service/#internal-load-balancer">internal load balancer</a>.

<h2>Azure plugin</h2>

We'll start with the Azure plugin as it is the one under the <em>Advanced Networking</em> setup.

It is commonly known as the <a href="https://github.com/Azure/azure-container-networking/blob/master/docs/cni.md">Azure VNET CNI Plugins</a> and is an implementation of the <a href="https://github.com/containernetworking/cni/blob/master/SPEC.md">
Container Network Interface Specification</a>.

The plugin assigns IPs to Kubernetes' components.

As we've seen in a <a href="https://vincentlauzon.com/2018/08/21/kubernetes-services-in-azure-aks-network-integration/">past article</a>, pods are assigned private IPs from an Azure Virtual Network.  Those IPs belong to the NICs of the VMs where those pods run.  They are secondary IPs on those NICs.

We end up with a Network picture as follow:

<img src="/assets/posts/2018/3/aks-with-kubenet-vs-azure-networking-plug-in/service1.png" alt="Advanced Networking" />

Basically, both pods and services get a private IP.  Services also get a cluster-ip (accessible only from within the cluster).

In order to test this configuration, we can deploy the following ARM Template:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Faks%2Fmaster%2Faks-kubenet%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

The first three parameters are related to the service principal <a href="https://vincentlauzon.com/2018/08/23/creating-a-service-principal-with-azure-cli/">we need to create</a>.

The fourth allows us to choose between <em>Kubenet</em> and <em>Azure</em> plugin.  Let's select <strong>Azure</strong> to test this section.

Once deployed we can connect to the cluster and deploy our <a href="https://github.com/vplauzon/aks/blob/master/aks-kubenet/service.yaml">service.yaml</a> file:

```bash
kubectl apply -f service.yaml
```

This file deploys 3 pods in a deployment and a service to load balance them.  Let's look at the service:

```bash
kubectl get services
```

We should see something like this:

```bash
NAME          TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
kubernetes    ClusterIP      10.0.0.1      <none>        443/TCP        6d
web-service   LoadBalancer   10.0.218.59   172.16.16.4   80:31917/TCP   1m
```

Our service is the one named <strong>web-service</strong>.  Its external IP belongs to the virtual network.  The cluster-IP is something that can only be resolved within the cluster.

Service IPs aren't public because the annotation <strong>service.beta.kubernetes.io/azure-load-balancer-internal</strong> in <a href="https://github.com/vplauzon/aks/blob/master/aks-kubenet/service.yaml">service.yaml</a>.

If we look at pods:

```bash
kubectl get pods -o wide
```

We can see the pods' IPs also are in the virtual network.

```bash
NAME                   READY     STATUS    RESTARTS   AGE       IP            NODE
web-54b885b89b-cwd7d   1/1       Running   0          3m        172.16.0.10   aks-agentpool-40932894-2
web-54b885b89b-j2xcc   1/1       Running   0          3m        172.16.0.73   aks-agentpool-40932894-1
web-54b885b89b-kwvxd   1/1       Running   0          3m        172.16.0.46   aks-agentpool-40932894-0
```

The Azure plugin gives private IPs to pods.

<h2>Kubenet plugin</h2>

The Kubenet plugin is related to basic networking.  This is used in the online documentation, for instance in the <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough">quickstart</a>.

Here pods' IPs are cluster-IPs.  That is they do not belong to the Azure Virtual Network but to <em>Kubernetes Virtual Network</em>.  They are therefore resolvable only from within the cluster.

Here we are going to do something different than basic networking.  We are going to deploy AKS inside an existing Virtual Network.

In order to test this configuration, we can deploy the following ARM Template:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Faks%2Fmaster%2Faks-kubenet%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

Again, the first three parameters are related to the service principal <a href="https://vincentlauzon.com/2018/08/23/creating-a-service-principal-with-azure-cli/">we need to create</a>.

The fourth allows us to choose between <em>Kubenet</em> and <em>Azure</em> plugin.  Let's select <strong>Kubenet</strong> to test this time around.

First, let's look at the resources in the portal.

If we look at the virtual network, we can see the connected devices:

<img src="/assets/posts/2018/3/aks-with-kubenet-vs-azure-networking-plug-in/kubenet-devices.png" alt="Network devices" />

We only see the cluster's VMs.  When we used <em>Azure</em> plugin, the pods got their own private IPs which were secondary IPs on the VMs' NICs.  Here pods aren't exposed in the Virtual Network so there is no such private IPs.  For that reason the Kubelet plugin consumes much less private IPs.

As usual with AKS, we'll have a <em>buddy resource group</em> named <code>MC___</code>.  Let's open it.

<img src="/assets/posts/2018/3/aks-with-kubenet-vs-azure-networking-plug-in/kubenet-resources.png" alt="Kubernet resources" />

We see the typical underlying resources of an AKS cluster.  One we do not see in an advanced networking cluster is the <em>Route Table</em>.  Let's open it.

<img src="/assets/posts/2018/3/aks-with-kubenet-vs-azure-networking-plug-in/routes.png" alt="Routes" />

We should see there are three routes.  That configuration routes 3 cluster-IP ranges to the three primary IPs of the three nodes.

This routing is necessary for requests to pods off node.  Let's imagine that a pod on the first node wants to contact a pod on the second node.  The cluster-IP can't be resolved internally.  So the request is sent and the routing table routes it to the second node.

If we look at the subnets where it is attached, we see it isn't attached.  This is a current bug as of this writing (early September 2018) and <a href="https://github.com/Azure/acs-engine/blob/master/docs/custom-vnet.md#post-deployment-attach-cluster-route-table-to-vnet">is actually documented</a>.  We need to attach the routing table to our vnet manually.  It only needs to be attached to the <em>aks</em> subnet.

Let's connect to the cluster and deploy our <a href="https://github.com/vplauzon/aks/blob/master/aks-kubenet/service.yaml">service.yaml</a> file:

```bash
kubectl apply -f service.yaml
```

It is the same file than the previous section.  It  deploys 3 pods in a deployment and a service to load balance them.  Let's look at the service:

```bash
kubectl get services
```

We should see something like this:

```bash
NAME          TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
kubernetes    ClusterIP      10.0.0.1      <none>        443/TCP        2h
web-service   LoadBalancer   10.0.207.13   172.16.16.4   80:30431/TCP   1m
```

<strong>web-service</strong> has an external IP belonging to the virtual network.  The cluster-IP is something that can only be resolved within the cluster.

AKS respected the <strong>service.beta.kubernetes.io/azure-load-balancer-internal</strong> annotation, since the IP is private.  It also respected the <strong>service.beta.kubernetes.io/azure-load-balancer-internal-subnet</strong> annotation since the private IP belongs to the <em>services</em> subnet.

Now if we look at pods:

```bash
kubectl get pods -o wide
```

We can see the pods' IPs <strong>do not</strong> belong to the virtual network.

```bash
NAME                   READY     STATUS    RESTARTS   AGE       IP            NODE
web-54b885b89b-b8446   1/1       Running   0          6m        10.16.0.200   aks-agentpool-37067697-0
web-54b885b89b-ml4tv   1/1       Running   0          6m        10.16.1.201   aks-agentpool-37067697-1
web-54b885b89b-pmklk   1/1       Running   0          6m        10.16.2.200   aks-agentpool-37067697-2
```

The kubenet plugin gives cluster IPs to pods.

<h2>When to choose kubenet vs Azure?</h2>

Now that we've seen both plugins, the natural question is when to use which?

We'll address that by looking at scenarios:

<table>
<thead>
<tr>
  <th>Scenario</th>
  <th>Preferred approach</th>
  <th>Comments</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Only public IPs</td>
  <td>kubenet</td>
  <td>For deploying only public IPs, the <em>basic networking</em> configuration is just simpler.  There is no VNET to managed as AKS manages its own VNET.</td>
</tr>
<tr>
  <td>Private IPs, outside access to pods</td>
  <td>Azure</td>
  <td>The only way to have access to pods from outside the cluster is to assign them a private IP address.</td>
</tr>
<tr>
  <td>Private IPs, no outside access to pods</td>
  <td>kubenet</td>
  <td>Azure plugin would also work here.  <em>basic networking</em> wouldn't work here, we need this intermediate configuration we demonstrated in this article where we deploy AKS in an existing VNET.</td>
</tr>
<tr>
  <td>Limited private IPs</td>
  <td>kubenet</td>
  <td>For companies linking their on-premise network to Azure (either via Express Route or simple VPN), there might be a concern of using large private IP ranges.  Kubenet plugins doesn't allocate private IPs to pods.  This reduces the number of required private IPs.</td>
</tr>
</tbody>
</table>

<h2>Summary</h2>

We've looked at <em>kubenet</em> and <em>Azure</em> network plugins for Kubernetes.

The former is associated with <em>basic networking</em>.  It manages pod IPs by allocating cluster IPs which are routable only from within the cluster.

The latter is associated with <em>advanced networking</em>.  It manages pod IPs by allocating a VNET private IP.  This is routable from anywhere within the VNET (or anything peered to that VNET).

We looked at a third configuration where we use the <em>kubenet</em> plugin but deploy AKS on an existing VNET.  This still allows us to deploy services within the existing VNET.  But it reduces the number of private IPs required.