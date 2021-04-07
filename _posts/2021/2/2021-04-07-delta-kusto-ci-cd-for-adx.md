---
title:  Delta Kusto - CI/CD for Azure Data Explorer (ADX)
permalink: /2021/04/07/delta-kusto-ci-cd-for-adx
image:  /assets/posts/2021/2/2021-04-07-delta-kusto-ci-cd-for-adx/delta-kusto-overview-thumbnail.png
categories:
- Solution
tags:
- Automation
- Data
- DevOps
---
<img style="float:left;padding-right:20px;" title="Delta Kusto" src="/assets/posts/2021/2/2021-04-07-delta-kusto-ci-cd-for-adx/delta-kusto-overview-thumbnail.png" />

It is finally done:  the first public release of [Delta Kusto](https://github.com/microsoft/delta-kusto)!

What is Delta Kusto?

>>> Delta-Kusto is a Command-line interface (CLI) enabling Continuous Integration / Continuous Deployment (CI / CD) automation with Kusto objects (e.g. tables, functions, policies, security roles, etc.) in Azure Data Explorer (ADX) databases. It can work on a single database, multiple databases, or an entire cluster. It also supports multi-tenant scenarios.

I've noticed multiple teams struggling to integrate a DevOps process with [Azure Data Explorer](https://vincentlauzon.com/2020/02/19/azure-data-explorer-kusto).  I thought of a solution based on a CLI that could work with any CI/CD engine (Azure DevOps, GitHub, Jenkins, etc.).  And...  I started to develop it.  It should take only a few hours, right?  I mean a CLI...

So those few hours turned into to hundreds...  I wanted unit tests, integration tests, automated releases, telemetry, etc.  .  The actual "Delta" code was pretty fast to write.  It's everything around it that took forever.  That was a great learning experience!

The last time I've done something similar was in 2014 with [DocumentDB Studio](https://vincentlauzon.com/2014/10/15/documentdb-studio/) (DocumentDB was Cosmos DB back then).  The deployment was way more amateurish so I underestimated the work for this one.

Nevertheless...

Delta Kusto is out for a spin as a Minimum Viable Product.  The current release only compute delta on Kusto functions.  The goal of the release is to validate its assumption and see if it can be useful before implementing more Kusto objects.

So do me a favor and give it a try!

See the [Delta Kusto Overview Tutorial](https://github.com/microsoft/delta-kusto/blob/main/documentation/tutorials/overview-tutorial/README.md) (or its [YouTube video little brother](https://www.youtube.com/watch?v=2neGBKlcoOA)) to get started!

I reproduce some of the tutorial here to explain a bit what Delta Kusto value prop is.

## Delta Kusto

Delta Kusto comes as a single-file executable available on both Windows and Linux distributed as a [GitHub release](https://github.com/microsoft/delta-kusto/releases).

The CLI accepts the path to a [parameter file](../../parameter-file.md).  The parameter file is a YAML file instructing Delta Kusto on what job to perform.

A single call to Delta Kusto can run multiple jobs.  This feature enables change management on multi-tenant solutions within Azure Data Explorer.  In this tutorial we'll only run one job at the time.

A job consists of a current and target *sources*.  Sources can either be a script (or set of scripts) or an ADX Database.  Delta Kusto can therefore compute the delta between 2 ADX Databases, between a script and an ADX Database or between 2 scripts (offline mode).

A job also defines actions.  An action specifies where to push the delta:  on the console, on files or on the current source (if the current source is an ADX Database).

This simple configuration enables multiple scenarios as we'll see in this tutorial.

The parameter file also defines a way for Delta Kusto to authenticate against ADX clusters via a Service Principal (see [Authenticating to ADX Clusters tutorial](../authentication/README.md) for details).

The parameter file is meant to be persisted in source control.  For that reason, we do not want to put sensitive information such as credentials.  We can override parameter file values with parameters to the CLI to avoid relying on the file containing sensitive data.  Overriding values can also be useful to re-use the same parameter file in different environments (e.g. by overriding the cluster URIs / database name).

In this tutorial, we are going to use only one cluster, but Delta Kusto can compute delta between multiple clusters.

## How Delta Kusto works

One of the strength of Delta Kusto is that it parses scripts and / or load database configuration into a database *model*.  It can then compare two models to compute a Delta.

This approach might seem overkilled when considering functions for instance where a simple `create-or-alter` can overwrite a function.  It does offer some advantages though:

1. Computes a minimalistic set of delta commands since it doesn't need to `create-or-alter` everything *just in case*
1. Detects drops (e.g. table columns) and can treat them as such
1. Can do *offline delta*, i.e. compare two scripts without any Kusto runtime involved.

## Summary

If you think Delta Kusto could help your Dev Ops process with Azure Data Explorer, head to the [Delta Kusto Overview Tutorial](https://github.com/microsoft/delta-kusto/blob/main/documentation/tutorials/overview-tutorial/README.md) (or its [YouTube video little brother](https://www.youtube.com/watch?v=2neGBKlcoOA)).

Please provide feedback either on this blog post or (preferably) on the [GitHub site](https://github.com/microsoft/delta-kusto).