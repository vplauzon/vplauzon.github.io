---
title:  Understanding multiple Ingress in AKS
date:  2018-11-28 11:30:48 +00:00
permalink:  "/2018/11/28/understanding-multiple-ingress-in-aks/"
categories:
- Solution
tags:
- Containers
- Networking
- Web
---
<img style="float:right;padding-right:20px;" title="From leeroy on www.pexels.com" src="https://vincentlauzon.files.wordpress.com/2018/11/ancient-army-e1541419212169.jpg" />

<a href="https://vincentlauzon.com/2018/11/21/understanding-simple-http-ingress-in-aks/">Last time</a>, I covered the ins and outs of Ingress on AKS.

We looked at how to install nginx ingress controller and how the controller is deployed as a load balanced service.  We did some URL based routing and domain name overloading.

This was in the spirit of clarifying the magic behind Ingress Controllers.

Another aspect of Ingress documentation I find could use more clarity is <em>multiple ingress controllers</em>.

There are many reasons why you might need to have multiple ingress controllers:

<ul>
<li>You need an internet facing one and a private network one</li>
<li>You need different controller implementations:  for some workloads you need the NGinx controller while for others you need Traefik (for example)</li>
<li>Your cluster is used by many line of businesses and is segmented by namespace ; each line of business needs its own controller</li>
<li>For whatever reason, you do not want to have a single public / private IPs for all your workloads</li>
</ul>

The most documented case is the first one.  I'll cover that in a future article.  Instead here, I want to be more general.

It's quite simple actually.  Once you understand how to work with multiple Ingress Controllers, the different scenarios will be a breeze to implement.

Scripts used in this article <a href="https://github.com/vplauzon/aks/tree/master/http-ingress">are on GitHub</a> for convenience.

<h2>Conceptually</h2>

Our understanding of Ingress Controller is the following:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/model.png" alt="Conceptual Model" />

The most important part is the top.  An Ingress Controller can have multiple Ingress rules.  But there could be multiple Ingress Controller.

The way to attach a rule to a controller is with the name of the controller.  Now for whatever reason the name of a controller is specified by its <em>class</em>.

That is the punchline.

That is what makes it a little confusing.

Let's experiment a bit.

<h2>Installing controllers</h2>

We assume the setup we covered in <a href="https://vincentlauzon.com/2018/11/21/understanding-simple-http-ingress-in-aks/">our last article</a>, i.e. the cluster and Helm is installed.

If we look at the node resource group, we should have:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/before.png" alt="Before multiple controllers" />

Here we have one public IP because we installed NGinx controller with a default configuration.  If we didn't we wouldn't have one.

We know we need to distinguish them by class, so let's look for that parameter in the chart:

[code lang=bash]
$ helm inspect stable/nginx-ingress | grep class
  ## Name of the ingress class to route through this controller
To use, add the `kubernetes.io/ingress.class: nginx` annotation to your Ingress resources.
`controller.ingressClass` | name of the ingress class to route through this controller | `nginx`
[/code]

So <code>controller.ingressClass</code> is the culprit.

Let's install 3 controllers with classes first, second &amp; third:

[code lang=bash]
helm install stable/nginx-ingress --set controller.ingressClass=first --namespace kube-system --set controller.replicaCount=2 --set rbac.create=false
helm install stable/nginx-ingress --set controller.ingressClass=second --namespace kube-system --set controller.replicaCount=2 --set rbac.create=false
helm install stable/nginx-ingress --set controller.ingressClass=third --namespace kube-system --set controller.replicaCount=2 --set rbac.create=false
[/code]

<h2>Deploying services</h2>

Let's deploy a few services using the ingress controllers.

We'll use the spec file <a href="https://github.com/vplauzon/aks/blob/master/http-ingress/multiple-controller.yaml">multiple-controller.yaml</a>:

[code lang=bash]
kubectl apply -f multiple-controller.yaml
[/code]

The file contains three (3) deployments of two (2) pods each:  blue, white &amp; red.  For instance, the <em>blue</em> one:

[code lang=bash]
# Blue deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blue-deploy
spec:
  replicas: 2
  selector:
    matchLabels:
      app:  blue
  template:
    metadata:
      labels:
        app: blue
    spec:
      containers:
      - name: myapp
        image: vplauzon/get-started:part2-no-redis
        env:
        - name:  NAME
          value: Blue-Pod
        ports:
        - containerPort: 80
[/code]

The pod simply displays <em>Blue Pod</em>.

For each deployment we deploy a service exposing the pods in ClusterIP.  For instance, the <em>blue</em> one:

[code lang=bash]
# Blue Service
apiVersion: v1
kind: Service
metadata:
  name: blue-svc
spec:
  type: ClusterIP
  ports:
  - port: 80
  selector:
    app: blue
[/code]

Finally, for each ingress controller, we deploy an ingress.  We expose the three services (blue, white &amp; red) with each controller.  A service isn't dedicated to an ingress and we use that fact here.

Here is the ingress for the <em>first</em> controller.  Notice the annotation <em>kubernetes.io/ingress.class</em>:  this is the mapping between the ingress and the ingress controller:

[code lang=bash]
# First Ingress
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: first-ingress
  annotations:
    kubernetes.io/ingress.class: first
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: /1-blue
        backend:
          serviceName: blue-svc
          servicePort: 80
      - path: /1-white
        backend:
          serviceName: white-svc
          servicePort: 80
      - path: /1-red
        backend:
          serviceName: red-svc
          servicePort: 80
[/code]

<h2>Testing</h2>

Before testing our configuration, we need to map the ingress controllers to public IPs.

If we look at the node resource group, we now find 3 new public ips:

<img src="https://vincentlauzon.files.wordpress.com/2018/11/after.png" alt="After multiple controllers" />

One for each controller.

Public IPs were provisioned when we installed the Ingress Controllers.  We could also provision them in advance and inject them by using <code>set controller.service.loadBalancerIP="X.Y.Z.W"</code>.  This is explained in the <a href="https://docs.microsoft.com/en-us/azure/aks/ingress-static-ip">online documentation</a>.

Since we didn't provision the public IPs we need to do some queries to map them:

[code lang=bash]
$ kubectl get svc --namespace kube-system -l component=controller
NAME                                           TYPE           CLUSTER-IP     EXTERNAL-IP       PORT(S)                      AGE
icy-chimp-nginx-ingress-controller             LoadBalancer   10.0.25.137    104.208.140.202   80:31611/TCP,443:31031/TCP   58m
illmannered-dolphin-nginx-ingress-controller   LoadBalancer   10.0.22.192    104.46.113.198    80:30482/TCP,443:30339/TCP   57m
rude-unicorn-nginx-ingress-controller          LoadBalancer   10.0.18.36     104.209.219.56    80:31333/TCP,443:30813/TCP   57m
stultified-puffin-nginx-ingress-controller     LoadBalancer   10.0.159.241   104.209.156.3     80:30737/TCP,443:32580/TCP   2d9h
[/code]

This query gives use the mapping between Nginx Helm release name (e.g. <em>icy-chimp</em>) and the external IP.

Now we can see what each release is about:

[code lang=bash]
$ helm get values icy-chimp
controller:
  ingressClass: first
  replicaCount: 2
rbac:
  create: false
[/code]

So we found out that, in our case, the first ingress controller corresponds to Helm release <em>icy-chimp</em> and has an external IP of 104.208.140.202.  We can now easily test it:

[code lang=bash]
$ curl 104.208.140.202/1-blue
&lt;h3&gt;Hello Blue-Pod!&lt;/h3&gt;&lt;b&gt;Hostname:&lt;/b&gt; blue-deploy-64fd54844c-q7nhk&lt;br/&gt;&lt;b&gt;Visits:&lt;/b&gt; undefined
[/code]

We can similarly test the other routes and other ingress.

<h2>Summary</h2>

We've seen it is quite simple to use multiple ingress controllers.

Each Ingress Controllers correspond to an Helm deployment.  We can set the class of a controller using the *--set controller.ingressClass=&#042; option.  A public (or private) IP is associated with each controller.

We map an ingress with an ingress controller using the <em>kubernetes.io/ingress.class</em> annotation.

And that's it!  We can have as many ingress controllers as we want.  We could deploy them to different namespaces if need be, by using the namespace override of Helm.

I hope this clarifies how to work with multiple ingress controllers!