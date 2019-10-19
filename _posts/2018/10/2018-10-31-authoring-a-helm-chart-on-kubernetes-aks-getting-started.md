---
title:  Authoring a Helm Chart on Kubernetes / AKS - Getting started
date:  2018-10-31 10:30:23 +00:00
permalink:  "/2018/10/31/authoring-a-helm-chart-on-kubernetes-aks-getting-started/"
categories:
- Solution
tags:
- Containers
- DevOps
---
<img style="float:right;padding-right:20px;" title="From http://pixabay.com" src="https://vincentlauzon.files.wordpress.com/2018/10/writer-1421099_640-e1539888033898.jpg" />

As we discussed in <a href="https://vincentlauzon.com/2018/10/24/5-reasons-to-use-helm-charts-in-kubernetes/">our last article</a>, <a href="https://www.helm.sh/">Helm</a> is a great technology.  I recommend using it not only to manage third party packages but also your own custom-developed solutions.

But how do you author a Helm Chart?

I found that question hard to answer.  The common answer is "look at existing ones".  I have two problems with that:

<ol>
<li>You'll be hit by complexity before you understand what a chart is so won't get very far.</li>
<li>That sounds a lot like the old C / C++ <a href="http://www.cs.colby.edu/maxwell/courses/tutorials/maketutor/">makefiles</a>:  copy mine and modify it to fit your needs.</li>
</ol>

Now, if there's a way to hate a technology and not want to use it, it is to have it rime with makefile.  I don't want that to happen to you, so, allow me to introduce you gently to Helm chart authoring.

In this article, we'll author the simplest chart ever.  The chart will deploy one Kubernetes resource:  a namespace.  It won't contain any parameters, any dependent charts, tests or what have you.  We will tour the world of Helm chart and run a bunch of commands to get familiar.

As usual, <a href="https://github.com/vplauzon/helm/tree/master/a-namespace">the code is on GitHub</a>.  There is also documentation out there.  I recommend:

<ul>
<li><a href="https://docs.helm.sh/using_helm/">Using Helm</a></li>
<li><a href="https://docs.helm.sh/developing_charts/">Developing charts</a></li>
</ul>

Both from the official Helm site.  It is comprehensive.  This article is shorter and simpler.

<h2>Installing</h2>

First you need to install Helm.

Helm comes as two components:  Helm on the client side (e.g. your computer) and tiller on the cluster.

We recommend looking at either <a href="https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm">AKS documentation</a> or <a href="https://docs.helm.sh/using_helm/#installing-helm">Helm documentation</a> for guidance.

<h2>Concepts</h2>

Let's get a few concepts out of the way.

From the official documentation, there are <a href="https://docs.helm.sh/using_helm/#three-big-concepts">three big concepts</a> we should be familiar with:

<ol>
<li>A <em>Chart</em> is a Helm package. It contains all of the resource definitions necessary to run an application, tool, or service inside of a Kubernetes cluster. Think of it like the Kubernetes equivalent of a Homebrew formula, an Apt dpkg, or a Yum RPM file.</li>
<li>A <em>Repository</em> is the place where charts can be collected and shared. It’s like Perl’s CPAN archive or the Fedora Package Database, but for Kubernetes packages.</li>
<li>A <em>Release</em> is an instance of a chart running in a Kubernetes cluster. One chart can often be installed many times into the same cluster. And each time it is installed, a new release is created. Consider a MySQL chart. If you want two databases running in your cluster, you can install that chart twice. Each one will have its own release, which will in turn have its own release name.</li>
</ol>

In short, a <em>Chart</em> is a Helm Package.  A <em>Release</em> is chart deployed, with parameters (or <em>values</em>), on a cluster.  It's like an <em>instance</em> of a chart.  A <em>Repository</em> is the central location where charts are collected and distributed.  It's like a <em>Docker Repository</em> but for charts (and way simpler).  <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-helm-repos">Azure Container Registry</a> can be used as a Helm Repository.

So we have the following relationships:

<img src="https://vincentlauzon.files.wordpress.com/2018/10/helmconcepts1.png" alt="Helm Concepts" />

<h2>File Structure</h2>

A chart is an archive, a TGZ (i.e. TAR + GZIP) archive.  It is composed of multiple files.

According to the <a href="https://docs.helm.sh/developing_charts/#the-chart-file-structure">official documentation</a>, the file structure of a chart is the following:

```powershell
<Chart Name>/
  Chart.yaml          # A YAML file containing information about the chart
  LICENSE             # OPTIONAL: A plain text file containing the license for the chart
  README.md           # OPTIONAL: A human-readable README file
  requirements.yaml   # OPTIONAL: A YAML file listing dependencies for the chart
  values.yaml         # The default configuration values for this chart
  charts/             # A directory containing any charts upon which this chart depends.
  templates/          # A directory of templates that, when combined with values,
                      # will generate valid Kubernetes manifest files.
  templates/NOTES.txt # OPTIONAL: A plain text file containing short usage notes
```/code]

We see there are a lot of <em>optionals</em> in there.  This is why it's easy to start.

Let's look at our example at https://github.com/vplauzon/helm/tree/master/a-namespace.  It has the following files:

```powershell
a-namespace/
  Chart.yaml
  README.md           # Optional but quick to write
  values.yaml         # Mandatory, but empty in our case
  templates/
    namespace.yaml    # The only resource this chart deploys:  a namespace
    NOTES.txt         # Optional but quick to write
```

As promised, this is pretty minimalist.

There really is content in only <a href="https://github.com/vplauzon/helm/blob/master/a-namespace/Chart.yaml">Chart.yaml</a> and <a href="https://github.com/vplauzon/helm/blob/master/a-namespace/templates/namespace.yaml">namespace.yaml</a>, so let's look at those.

<h3>Chart.yaml</h3>

Chart.yaml's schema <a href="https://docs.helm.sh/developing_charts/#the-chart-yaml-file">is defined in the official documentation</a>.  It contains a few mandatory fields and a lot of optional ones.

Our <a href="https://github.com/vplauzon/helm/blob/master/a-namespace/Chart.yaml">Chart.yaml</a> is defined as follow:

```powershell
apiVersion: v1
name: a-namespace
version: 0.1.0
description: A simple example of a chart::  solely deploys a namespace
keywords:
  - namespace
  - simple
home: https://github.com/vplauzon/helm/tree/master/a-namespace
sources:
  - https://github.com/vplauzon/helm/tree/master/a-namespace
maintainers: # (optional)
  - name: Vincent-Philippe Lauzon
    email: NA
    url: http://vincentlauzon.com/
```

It stands in 14 lines.  Let's look at a few of them:

<table>
<thead>
<tr>
  <th>Line #</th>
  <th>Field</th>
  <th>Comments</th>
</tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>apiVersion</td>
  <td>Always <em>v1</em>:  easy.</td>
</tr>
<tr>
  <td>2</td>
  <td>name</td>
  <td>Name of the chart.  It must match the folder name.</td>
</tr>
<tr>
  <td>3</td>
  <td>version</td>
  <td>That's the package version.  This will appear later when we list the Helm releases running on the Cluster.</td>
</tr>
<tr>
  <td>5</td>
  <td>keywords</td>
  <td>Those are useful for feeding in the search (i.e. <em>helm search</em> command) within a repository</td>
</tr>
</tbody>
</table>

The rest is purely informational.

<h3>Template</h3>

In our case we have only one template:  <a href="https://github.com/vplauzon/helm/blob/master/a-namespace/templates/namespace.yaml">namespace.yaml</a>.  In general, there are many files in the <em>template</em> folder.

It is recommended practice to have one Kubernetes resource per template file.

<a href="https://github.com/vplauzon/helm/blob/master/a-namespace/templates/namespace.yaml">namespace.yaml</a> has the following content:

```powershell
apiVersion: v1
kind: Namespace
metadata:
  name: helm-deployed
```

This template is straightforward as there is no values.  We'll cover values in a future article.  It is a simple <a href="https://kubernetes.io/docs/tasks/administer-cluster/namespaces/#creating-a-new-namespace">namespace description</a>.

When there are many files in the template folder, or even many resources in one file, the resources are sorted by kind and then alphabetic order for deployment.

<h2>Deployment</h2>

Before we deploy our chart, let's look at the <em>current namespaces</em>:

```bash
$ kubectl get namespaces
NAME          STATUS   AGE
default       Active   4d
kube-public   Active   4d
kube-system   Active   4d
```

This is the typical configuration of a vanilla AKS cluster.

<code>helm install</code> is used to install a chart, i.e. create a release.  We can install from different sources:

<ul>
<li>Local folder (unpacked chart)</li>
<li>Local archive (.tgz)</li>
<li>Remote archive (i.e. URL)</li>
<li>From repository</li>
</ul>

Let's do the first one.  Let's clone the <a href="https://github.com/vplauzon/helm">repo</a> and position ourselves just above the <em>a-namespace</em> folder.

Now we can install by typing:

```bash
$ helm install a-namespace
NAME:   coiled-heron
LAST DEPLOYED: Wed Oct 17 13:33:26 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Namespace
NAME           AGE
helm-deployed  0s


NOTES:
No values are supported.  This is the most vanilla chart.
```de]

A couple of observations here:

<ul>
<li>The name is generated as <em>coiled-heron</em> in our case ; this is random ; we'll see we can set the name</li>
<li>The namespace is <em>default</em> ; this is the namespace where templates not specifying a namespace will be deployed (in our case it doesn't apply as we only deploy a namespace per se)</li>
<li>It lists the resources that were deployed ; in our case <em>helm-deployed namespace</em></li>
<li>The <em>NOTES section</em> is the <a href="https://github.com/vplauzon/helm/blob/master/a-namespace/templates/NOTES.txt">NOTES.txt</a> file content</li>
</ul>

Now if we look at the cluster's namespaces again:

```bash
$ kubectl get namespaces
NAME            STATUS   AGE
default         Active   4d
helm-deployed   Active   1m
kube-public     Active   4d
kube-system     Active   4d
```

We observe the <em>helm-deployed</em> namespace that was just deployed.

Let's look at the charts installed in the cluster:

```bash
$ helm list
NAME            REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
coiled-heron    1               Wed Oct 17 13:33:26 2018        DEPLOYED        a-namespace-0.1.0                       default
```

We observe the following:

<ul>
<li>The release name is there:  <em>coiled-heron</em></li>
<li>The revision is 1 ; this isn't the chart's version, it is the release's revision</li>
<li>The chart is <em>a-namespace-0.1.0</em>, which is a concatenation of the chart's name and version</li>
</ul>

At a glance we can see what is deployed on our system.

The revision is an integer incrementing at every update.  It is used to track upgrades and rollbacks.

Let's delete the release and confirm the namespace is gone:

```bash
$ helm delete coiled-heron
release "coiled-heron" deleted
$ kubectl get namespaces
NAME            STATUS   AGE
default         Active   4d
kube-public     Active   4d
kube-system     Active   4d
```4d
[/code]

Now, let's reinstall the chart by given the release a name this time:

```bash
$ helm install --name myrelease a-namespace
NAME:   myrelease
LAST DEPLOYED: Wed Oct 17 13:39:18 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Namespace
NAME           AGE
helm-deployed  0s


NOTES:
No values are supported.  This is the most vanilla chart.
```de]

We can then find that release name in the list of releases as well:

```bash
$ helm list
NAME            REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
myrelease       1               Wed Oct 17 13:39:18 2018        DEPLOYED        a-namespace-0.1.0                       default
```

<code>helm list</code> returns the list of deployed releases.  Helm tracks deleted releases for audit purposes.  We can see all releases, including deleted ones with:

```bash
$ helm list --all
NAME            REVISION        UPDATED                         STATUS          CHART                   APP VERSION     NAMESPACE
coiled-heron    1               Wed Oct 17 13:33:26 2018        DELETED         a-namespace-0.1.0                       default
myrelease       1               Wed Oct 17 13:39:18 2018        DEPLOYED        a-namespace-0.1.0                       default
```

Finally, we could package our chart:

```bash
$ helm package a-namespace/
Successfully packaged chart and saved it to: /home/vplauzon/git/helm/a-namespace-0.1.0.tgz
```

The created archive could then be uploaded to a repository (e.g. <a href="https://docs.microsoft.com/en-us/azure/container-registry/container-registry-helm-repos">Azure Container Registry</a>).

<h2>Summary</h2>

We did a quick <em>getting started</em> on Kubernetes Helm.

We saw the big concepts, the file structure, a very simple example and a couple of command lines.

Helm is quite easy to use and not so complicated to author.  We hope this quick start will help you start authoring Helm charts for your projects!

<strong>Update (07-11-2018)</strong>:  See <a href="https://vincentlauzon.com/2018/11/07/authoring-a-helm-chart-on-kubernetes-aks-parametrized-values/">Authoring a Helm Chart on Kubernetes / AKS – Parametrized values</a> on how to author charts with parameters.