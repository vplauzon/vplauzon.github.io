---
title:  About Ingress in Azure Kubernetes Service (AKS)
date:  2018-10-10 06:30:27 -04:00
permalink:  "/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/"
categories:
- Solution
tags:
- Containers
- Networking
---
I did a bit of experimentation with Kubernetes Ingress, more specifically NGINX, lately.

I found the concept of Ingress utterly confusing at first.  It is actually relatively simple.  So, I thought I would share this sense of simplicity.

This article is conceptual.  There will be no code nor even Portal tour.

If you want to ramp up on Ingress in AKS, I would suggest the following readings, in order:

<ol>
<li><a href="https://kubernetes.io/docs/concepts/services-networking/ingress/">Ingress documentation from Kubernetes.io</a>:  this is Azure agnostic ; it explains the concepts &amp; give generic examples</li>
<li><a href="https://docs.microsoft.com/en-ca/azure/aks/ingress-basic">Azure AKS documentation online</a>:  there are multiple articles on Ingress covering different topics ; this gives example on AKS</li>
<li><a href="https://www.goodreads.com/book/show/34013922-kubernetes-in-action">Book Kubernetes in Action by Marko Luksa</a>, specifically chapter 5:  the book is available on <a href="https://www.safaribooksonline.com/library/view/kubernetes-in-action/9781617293726/">Safari Book Online</a></li>
</ol>

<h2>Ingress vs Service</h2>

We discussed the integration Kubernetes &amp; Azure Networking within AKS in a <a href="https://vincentlauzon.com/2018/08/21/kubernetes-services-in-azure-aks-network-integration/">past article</a>.

We used the following diagram to describe the anatomy of a service:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/containers4.png" alt="Anatomy of a Service" />

We described a service as offering a stable IP, load balancing a group of pods  and typically realized through a replica set.

Now that we have a service that we can connect to, what is the need for <em>Ingress</em>?

It is a question of Layer 4 (Service) vs Layer 7 (Ingress) load balancing.  A service offers TCP load balancing.  An ingress understands HTTP / HTTPS.  It understands the host header, the path and can handle TLS termination.

An ingress also is a reverse proxy:  it generates a new HTTP requests to the underlying service.

Ingress acts as a front door to services.  We can then upgrade our anatomy knowledge as follow:

<img src="https://vincentlauzon.files.wordpress.com/2018/10/ingressanatomy.png" alt="Ingress Anatomy" />

<h2>Different use cases</h2>

Let's look at a few scenarios.

The first one is what in <a href="https://vincentlauzon.com/2017/05/08/url-routing-with-azure-application-gateway/">Application Gateway parlance</a> we would call <em>URL Based routing</em>.  For instance, an ingress takes requests for http://vincentpizza.com and forwards requests under http://vincentpizza.com/offers/ to the <em>pizza-offers</em> service and requests under http://vincentpizza.com/menu/ to the <em>pizza-menu</em> service.

<img src="https://vincentlauzon.files.wordpress.com/2018/10/url-based-routing.png" alt="URL Based routing" />

Another one is hosting multiple domain names on the same ingress (e.g. public IP) using host name for routing.

<img src="https://vincentlauzon.files.wordpress.com/2018/10/virtualhosting.png" alt="Virtual Hosting" />

Of course, we could combine both previous approaches.

As the diagram suggests, an ingress has a many-to-many relationship with services.  We could <em>reuse</em> a service in multiple rules.

<h2>Conceptual communication</h2>

Conceptually, the communication pattern goes a bit like this:

<img src="https://vincentlauzon.files.wordpress.com/2018/10/conceptual1.png" alt="Conceptual Communication" />

The ingress routes traffic to a service which then route it to a pod.

An ingress controller is implemented as a Kubernetes Service of type <em>load balancer</em>.

This is similar to Azure Application Gateway which is implemented as a set of VMs fronted with an Azure Load Balancer.

Typically, <em>backend</em> services, i.e. services ingresses call into, are of type <em>Cluster IP</em> since they only need to be reached from within the cluster.

<h2>Azure communication</h2>

Now, how does that land in Azure?

Let's assume we have 3 nodes (3 VMs) in our AKS cluster.

As mentioned, an Ingress Controller is a service of type <em>load balancer</em>.  In Azure, the service is exposed through an Azure Load Balancer.

<img src="https://vincentlauzon.files.wordpress.com/2018/10/azure.png" alt="Azure Communication" />

Let's assume the request gets load balanced on a pod running on node 3.  The Ingress Controller applies ingress rules and determine the backend service to forward the request to.

The Ingress Controller then uses then forward the request to one of the pods.  Here we assume the load balanced pod would be on the node 2.

<h2>Application Gateway as an Ingress Controller</h2>

We talked about Ingress Controller without mentioning any specific one.  As often is the case with Open Source, there is a lot of choice.

Kubernetes maintains the <a href="https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/">NGINX Ingress Controller</a>.  This is the one we encountered most often in online documentations.  There is even an <a href="https://github.com/kubernetes/ingress-nginx/blob/master/docs/user-guide/third-party-addons/modsecurity.md">extension of that Controller</a> implementing WAF functionality.

The company <a href="https://www.nginx.com/">NGINX</a> maintains another flavour of <a href="https://www.nginx.com/products/nginx-controller/">NGINX Controller</a>, which is a branded as more <em>Enterprise friendly</em>.

There is <a href="https://azure.github.io/application-gateway-kubernetes-ingress/">current development</a>, at the time of this writing (mid October 2018), of an Ingress Controller that will integrate with Azure Application Gateway.  Application Gateway will therefore be an option as an Ingress Controller sitting outside the AKS cluster.

<h2>Summary</h2>

We did a brief tour of what Ingress means within Kubernetes and how it lands in AKS.

We recommend going through the documentation we provided at the beginning of the article to acquire more depth.