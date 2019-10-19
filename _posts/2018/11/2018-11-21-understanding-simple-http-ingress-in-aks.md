---
title: Understanding simple HTTP Ingress in AKS
date: 2018-11-21 06:30:58 -05:00
permalink: /2018/11/21/understanding-simple-http-ingress-in-aks/
categories:
- Solution
tags:
- Containers
- Networking
- Web
---
<img style="float:left;padding-right:20px;" title="From leeroy on www.pexels.com" src="/assets/2018/11/understanding-simple-http-ingress-in-aks/door-e1541192827600.jpg" />

We <a href="https://vincentlauzon.com/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/">looked at Kubernetes Ingress conceptually</a>.  We looked at different use cases:  URL based routing and multiple domains.

We also looked at how ingress was implemented from an AKS perspective, i.e. where traffic was routed in nodes.

In this article, I wanted to get hands on.  I figured we could start slowly with simple configuration:  public internet endpoints and no TLS / certificates.

I found ingress thinly documented.  Different online tutorials leave a lot of details unexplained.  This gave me of a sense of "magic" around Ingress.

I love magic with hats and bunnies, not with computer technologies.  So, let's have a look under the hood to dissipate all that smoke.

Scripts used in this article <a href="https://github.com/vplauzon/aks/tree/master/http-ingress">are on GitHub</a> for convenience.

<h2>Cluster Creation</h2>

Let's first create a cluster.

We won't do anything fancy around AKS network plugins as we did in a <a href="https://vincentlauzon.com/2018/09/06/aks-with-kubenet-vs-azure-networking-plug-in/">past article</a>.  Instead, we'll go the easiest route based on the <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-walkthrough">AKS online quick start documentation</a>.

So in a shell, using the Azure CLI, let's do:

```bash
az group create --name aks-group --location eastus2
az aks create --resource-group aks-group --name aks-cluster --node-count 3 --generate-ssh-keys -s Standard_B2ms --disable-rbac
az aks get-credentials -g aks-group -n aks-cluster
```

<a href="https://github.com/vplauzon/aks/blob/master/http-ingress/create-cluster.sh">This script</a> creates a cluster named <em>aks-cluster</em> in the resource group <em>aks-group</em> in <em>East US 2</em> region.

The first line creates the resource group.  The second the cluster.   The third securely gets the credentials from the cluster so we can connect with <em>kubectl</em>.

The cluster has 3 nodes of B2 skus VMs.  B2 are <em>burstable</em> VMs, the cheapest we can use with AKS.

The cluster has <em>disable rbac</em> which simplifies the following configurations we are going to do.

<h2>Helm</h2>

We'll need Helm.  We <a href="https://vincentlauzon.com/2018/10/31/authoring-a-helm-chart-on-kubernetes-aks-getting-started/">discussed Helm authoring</a>.  Here we are just going to use its package management capacity as a consumer.

So we need to install the Helm client.  We recommend looking at the <a href="https://docs.helm.sh/using_helm/#installing-helm">online Helm Documentation</a> for installing the client.

Then we can install Helm server-side component, <em>Tiller</em>:

```bash
helm init
```

<strong>Warning, this installs the tiller in a non-secured manner and isn't recommended for production scenarios</strong>.  To secure tiller, see the <a href="https://docs.helm.sh/using_helm/#securing-your-helm-installation">Helm online documentation</a>.

<h2>Installing Nginx Ingress Controller</h2>

As discussed in our <a href="https://vincentlauzon.com/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/">conceptual survey of Ingress in AKS</a>, the Ingress Controller is the component picking up web requests.

We'll <a href="https://github.com/vplauzon/aks/blob/master/http-ingress/install-ingress-controller.sh">install it using Helm</a>:

```bash
helm install stable/nginx-ingress --namespace kube-system --set controller.replicaCount=2 --set rbac.create=false
```

This command installs the <em>nginx-ingress</em> chart found in the <em>stable</em> repository.  The <em>stable</em> repository is a public repo installed by default.  We can look at installed repos by typing <code>helm repo list</code>.

We install the chart in the <em>kube-system</em> namespace where other cluster-wide components live.  This isn't a requirement but is recommended practice.  We override two configuration values:

<ol>
<li>The number of replicas:  we specify we want the controller to have 2 replicas for High Availability</li>
<li>RBAC:  we specify we do not use RBAC in our cluster</li>
</ol>

<h2>Nginx deployments</h2>

Let's look at how the controller got deployed:

```bash
$ kubectl get deploy --namespace kube-system -l app=nginx-ingress
NAME                                              DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
stultified-puffin-nginx-ingress-controller        2         2         2            2           9h
stultified-puffin-nginx-ingress-default-backend   1         1         1            1           9h
```

We see two deployments related to nginx:
* Ingress Controller (stultified-puffin-nginx-ingress-controller)
* Default Back end (stultified-puffin-nginx-ingress-default-backend)

The prefix of the deployment, in our case <em>stultified-puffin</em>, is randomly generated by Helm.  It is the name of the Helm release as we can see with:

```bash
$ helm list
NAME                    REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
stultified-puffin       1               Sun Nov  4 07:58:39 2018        DEPLOYED        nginx-ingress-0.28.2    0.19.0          kube-system
```

The Ingress controller has a desired number of replicas of 2.  This is because we specified 2 in the controller.replicaCount value in the helm install.

In general, we can see all the values we can set in an Helm chart by <em>inspecting it</em>.  For instance, <code>helm inspect stable/nginx-ingress</code> will return all the configurations we can override.  <code>helm inspect stable/nginx-ingress | grep replica</code> narrows it down.

It is good practice to have 2 replicas of the controller for high availability.  It would be silly to have the ingress controller being less available than the services it fronts.

The default back end hosts the page returned when a request doesn't hit any of ingress rule.  It is the catch all pod.  It has only one replica:  this shouldn't be hit in practice so no need to burn compute on it.

<h2>Nginx Services</h2>

Let's look at the corresponding services:

```bash
$ kubectl get services --namespace kube-system -l app=nginx-ingress
NAME                                              TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                      AGE
stultified-puffin-nginx-ingress-controller        LoadBalancer   10.0.159.241   104.209.156.3   80:30737/TCP,443:32580/TCP   28m
stultified-puffin-nginx-ingress-default-backend   ClusterIP      10.0.133.159   <none>          80/TCP                       28m
```

As we discussed in the <a href="https://vincentlauzon.com/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/">conceptual article</a>, the ingress controller is itself a service that front other services.

The controller is a load balanced service exposed with a public IP.  In our case this is 104.209.156.3.  The public IP will be different for every deployment.  This is configurable as we'll see in future articles.  For instance, the ingress controller can be exposed through a private IP.

The default backend has a <em>ClusterIP</em> only.  It is common practice not to expose services externally if we expose them through an ingress.

The public IP is in the <em>node resource group</em>.  This is the resource group where the underlying AKS resources (e.g. VMs) are deployed.  Typically, it has a name of "shape" <code>MC___</code>.  The name of the group is actually a property of the cluster resource:

```bash
$ az aks show -g aks-group -n aks-cluster --query nodeResourceGroup -o tsv
MC_aks-group_aks-cluster_eastus2
$ az network public-ip list -g MC_aks-group_aks-cluster_eastus2 --query [*].ipAddress
[
  "104.209.156.3"
]
```

Now if we browse at that IP:

```bash
$ curl 104.209.156.3
default backend - 404
```

We get the default back end service since no ingress is configured.

<h2>URL based routing</h2>

Now let's see one of the patterns we discussed in a previous article:

<img src="/assets/2018/11/understanding-simple-http-ingress-in-aks/url-based-routing.png" alt="URL based routing" />

This is called <a href="https://kubernetes.io/docs/concepts/services-networking/ingress/#simple-fanout">Simple fan out</a> in Kubernetes documentation.

Let's add a domain name on the IP address.  This isn't mandatory, but it will make the sample clearer.

Let's go to the IP address in the node resource group, using the portal.  In the Configuration tab, let's specify the DNS name label as <em>vincentpizza</em>:

<img src="/assets/2018/11/understanding-simple-http-ingress-in-aks/dns-label.png" alt="Setting DNS name label" />

Let's deploy <a href="https://github.com/vplauzon/aks/blob/master/http-ingress/url-based-routing.yaml">url-based-routing.yaml</a>:

```bash
kubectl apply -f url-based-routing.yaml
```

Let's look at the file.  It contains the deployment &amp; service for pizza-offers, deployment &amp; service for pizza-menu and the ingress combining both.

We leverage a simple container <a href="https://vincentlauzon.com/2018/04/24/getting-started-with-docker-in-azure/">we did a while back</a>.  It takes an environment variable <em>NAME</em>.  It outputs that variable on requests.

```bash
# Offers deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pizza-offers-deploy
spec:
  replicas: 2
  selector:
    matchLabels:
      app:  pizza-offers
  template:
    metadata:
      labels:
        app: pizza-offers
    spec:
      containers:
      - name: myapp
        image: vplauzon/get-started:part2-no-redis
        env:
        - name:  NAME
          value: pizza-offers
        ports:
        - containerPort: 80
---
# Offers Service
apiVersion: v1
kind: Service
metadata:
  name: pizza-offers-svc
spec:
  type: ClusterIP
  ports:
  - port: 80
  selector:
    app: pizza-offers
```

Nothing fancy here.  Again, services aren't using private or public IPs in Azure since we are going to expose them through ingress.  Instead they use a ClusterIP.

The ingress resource is interesting:

```bash
# Url Based Routing Ingress
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: url-routing-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: vincentpizza.eastus2.cloudapp.azure.com
    http:
      paths:
      - path: /pizza-offers
        backend:
          serviceName: pizza-offers-svc
          servicePort: 80
      - path: /menu
        backend:
          serviceName: pizza-menu-svc
          servicePort: 80
```

In the rules we route depending on paths.

We can then browse to both path on our public IP and see the ingress in action:

<img src="/assets/2018/11/understanding-simple-http-ingress-in-aks/url-routing.png" alt="URL Routing Browsing" />

The ingress is a service reverse proxying other services.  Under the same domain name we have two applications running on different pods (processes).  They appear to be the same application thanks to ingress.

It is interesting to notice that if we browse to http://vincentpizza.eastus2.cloudapp.azure.com/, we'll fall back to the default back-end.

<h2>Domain name overload</h2>

To properly demonstrate the domain name overload, we need multiple domain names.

<img src="/assets/2018/11/understanding-simple-http-ingress-in-aks/virtualhosting.png" alt="Domain name overload" />

This is called <a href="https://kubernetes.io/docs/concepts/services-networking/ingress/#name-based-virtual-hosting">Name based virtual hosting</a> in Kubernetes documentation.

Here we'll simulate that by changing the DNS name label of our public IP between tests.

But first, let's deploy <a href="https://github.com/vplauzon/aks/blob/master/http-ingress/domain-name-overload.yaml">domain-name-overload.yaml</a>:

```bash
kubectl apply -f domain-name-overload.yaml
```

The file contains services and deployments similar to previous example.  Instead of offers and menus, we have bikes and cars.

The ingress is different:

```bash
# Domain name overload Ingress
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: domain-name-overload-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: bikes.eastus2.cloudapp.azure.com
    http:
      paths:
      - backend:
          serviceName: bikes-svc
          servicePort: 80
  - host: cars.eastus2.cloudapp.azure.com
    http:
      paths:
      - backend:
          serviceName: cars-svc
          servicePort: 80
```

Here instead of having multiple paths for one host, we have multiple hosts with no paths.

In order to test this, we must change the DNS name label on our public IP.  First we change it to <em>bikes</em> then <em>cars</em> while browsing to respective host names.

We could use <a href="https://docs.microsoft.com/en-us/azure/dns/dns-overview">Azure DNS service</a> to simulate this multi-host properly, but this would lengthen an already long blog post.

<h2>Validating communication</h2>

In our <a href="https://vincentlauzon.com/2018/10/10/about-ingress-in-azure-kubernetes-service-aks/">conceptual article</a>, we establish that ingress communications look a bit like this:

<img src="/assets/2018/11/understanding-simple-http-ingress-in-aks/azure.png" alt="Communication" />

Let's validate this by looking at the Ingress Controller's pods and the pizza-offers pods:

```bash
$ kubectl get pods --namespace kube-system -l app=nginx-ingress,component=controller -o wide
NAME                                                         READY   STATUS    RESTARTS   AGE   IP           NODE                       NOMINATED NODE
stultified-puffin-nginx-ingress-controller-584cfc6b8-vczgm   1/1     Running   0          9h    10.244.1.5   aks-nodepool1-10135362-1   <none>
stultified-puffin-nginx-ingress-controller-584cfc6b8-wrqgs   1/1     Running   0          9h    10.244.2.3   aks-nodepool1-10135362-2   <none>
$ kubectl get pods -l app=pizza-offers -o wide
NAME                                   READY   STATUS    RESTARTS   AGE   IP           NODE                       NOMINATED NODE
pizza-offers-deploy-78c8f6d797-fsb7c   1/1     Running   0          52m   10.244.0.6   aks-nodepool1-10135362-0   <none>
pizza-offers-deploy-78c8f6d797-lffrt   1/1     Running   0          52m   10.244.1.7   aks-nodepool1-10135362-1   <none>
```

We see the ingress controller is running on node 1 &amp; 2 while the pizza-offers run on node 0 &amp; 1.

<h2>Summary</h2>

We've taken an in-depth look at how Ingress Controllers are deployed in an AKS cluster and how they work.

I hope this achieve the goal of removing the smoke effect ingress often have due to high level documentation.