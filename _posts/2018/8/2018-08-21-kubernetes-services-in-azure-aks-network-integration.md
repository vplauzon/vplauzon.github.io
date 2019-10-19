---
title:  Kubernetes Services in Azure AKS - Network integration
date:  2018-08-21 06:30:54 -04:00
permalink:  "/2018/08/21/kubernetes-services-in-azure-aks-network-integration/"
categories:
- Solution
tags:
- Containers
- Networking
---
<img style="float:right;" src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/sailboat-1741006_640-21-e1534512423281.jpg" title="Pulleys from Pixabay" />

<a href="https://vincentlauzon.com/?s=aks">Azure Kubernetes Services</a> (AKS) is a managed Kubernetes service in Azure.  Not only does it provides a managed cluster, it also integrates with Azure services.

In this article we'll explain the integration between Kubernetes' services and Azure Networking.  We won't give code sample though as we'll keep that for a future article.

<strong>Update (30-08-2018):  See the <a href="http://vincentlauzon.com/2018/08/28/deploying-aks-with-arm-template-network-integration/">following article</a> in order to deploy and test the concepts established here using an ARM Template</strong>.

<h2>Anatomy of Services</h2>

Let's dive right in.  I like to think about a Kubernetes service in the following way:

<img src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/containers4.png" alt="Anatomy" />

From the ground up:

<table>
<thead>
<tr>
  <th>Component</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td><a href="https://kubernetes.io/docs/concepts/containers/images/">Container Image</a></td>
  <td>Contains all the files enabling a container runtime.  It also holds the ports configuration.</td>
</tr>
<tr>
  <td>Container</td>
  <td>Based on an image, it runs within the image context.  It also maps VM ports to inside-container ports.</td>
</tr>
<tr>
  <td><a href="https://kubernetes.io/docs/concepts/workloads/pods/pod/">Pod</a></td>
  <td>A pod can run one or many containers.  A pod has its own IP.  A pod maps the VM ports used by the container the IP of the pod.</td>
</tr>
<tr>
  <td><a href="https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/">Replica Set</a></td>
  <td>Pods are ephemeral and can die.  A <em>Replica set</em> ensures a number of pods following the same template (e.g. container images) are up and running.  A <em>selector</em> allows the replica set to aggregate its pods.</td>
</tr>
<tr>
  <td><a href="https://kubernetes.io/docs/concepts/services-networking/service/">Service</a></td>
  <td>A service exposes a bunch of pods as a single...  <em>service</em>.  A service also has its own IP.  It maps the pods port to that IP. It aggregates multiple pods via a <em>selector</em>.</td>
</tr>
</tbody>
</table>

A few observations:

<ul>
<li>A service isn't dependant on a replica set directly.  The replica set ensures multiple pods are running.  The service exposes those pods.</li>
<li>Ports are mapped multiple times (from image to container to pod to service)</li>
<li>IPs are mapped a few times (from VM to pod to service)</li>
<li>Kubernetes' DNS plugin allows IP virtualization ; this is why some IPs are accessible from within the cluster but not from outside of it.</li>
</ul>

<h2>Services in AKS</h2>

Kubernetes is designed to integrate to cloud environments.  It has different plugins implemented differently on different cloud platforms.

There are two network modes for AKS:  Basic &amp; Advanced.

Under basic networking, AKS manages its own Virtual Network.  Pods IPs are accessible from within the cluster.  Only publicly exposed services are accessible outside the cluster.

Under advanced networking, AKS's nodes are deployed within a specified Azure Virtual Network we control.  This allows us to keep the services running on AKS on private IPs.  It also allows us to make them accessible from on premise network.

<h2>Advanced Networking scenario</h2>

There are many ways to leverage Kubernetes in AKS.  To simplify the discussion, let's take one scenario:

<ul>
<li>One private service (i.e. no public IP)</li>
<li>3 pods based on one container</li>
<li>AKS Cluster with 3 nodes</li>
<li>Service is exposed in a separate subnet</li>
<li>We use Azure Load Balancer</li>
<li>Ports are different

<ul>
<li>Container exposes port 80 internally</li>
<li>Pod remaps it on its port 85</li>
<li>Service is exposing the pods on port 90</li>
</ul></li>
</ul>

This is a simple scenario for Advanced Networking.  The last point, i.e. port mapping, is somewhat complicated.  We chose that configuration to show port mapping.

Let's see how this scenario lands in AKS.

<h3>Virtual Network</h3>

First, we have our Virtual Network before we deploy AKS in it.

<img src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/virtual-network.png" alt="Virtual Network" />

We configure it with two subnets:

<ul>
<li><em>AKS</em>:  this is the subnet for AKS</li>
<li><em>Services</em>:  this is where we are going to take private IPs for services</li>
</ul>

<h3>Deploying AKS</h3>

Now we deploy AKS in <em>Advanced Networking</em> mode.  We specify the <em>AKS</em> subnet.

<img src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/vms.png" alt="VMs" />

Under the hood, AKS deploys 3 VMs with a <em>NIC</em> each.  Each VM has a private IP.  In Kubernetes, those are the <em>Nodes</em> IPs.

<h3>Deploying a replica set</h3>

Now let's deploy our replica set.  This deploys 3 pods on our cluster.

Each pod is given a private IP within the same subnet as the VM.  The pod expose port 85.  It remaps the container port 80 to port 85.

<img src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/pods1.png" alt="Pods" />

Under the hood, those IPs belong to the VMs and are assigned at creation.  They are mapped to pods as pods are created.

<h3>Deploying a service</h3>

Finally, we deploy our service using Azure Load Balancer.  We specify <em>Services Subnet</em> as the target subnet.

The Azure Load Balancer has a private IP and forwards traffic to pods.  It exposes the port 90 and forwards traffic from that port to the pods' port 85.

In Kubernetes lingo this is called the <em>External IP</em>.

<img src="/assets/2018/8/kubernetes-services-in-azure-aks-network-integration/service1.png" alt="Service" />

The service also has an <em>Internal IP</em>.  That internal IP doesn't belong to the Virtual Network.  It is a virtual address routable only from within the cluster.  That IP simply routes to the load balance private IP.

<h2>Summary</h2>

We hope this overview of Services in Kubernetes and AKS clarified some of the mechanisms at play.

In a future article, we will give explore to implement what we've explore in this article.