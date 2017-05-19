# Cinemark-RSS

This is a command-line tool that reads any Cinemark theater's movie listings and generates an RSS feed of the data.

I use it to keep updated on which movies are in my local theater.

## Usage

* Visit [cinemark.com](https://www.cinemark.com/) and find your theater's listings.
* Look in the URL, it should end with "/theater-1234" with the theater number.
* `node index.js 1234` will spit out the RSS to the console.
 
## Note

This is my first node.js script. It's not robust. It's not elegant. It could certainly be done better. But it works. Don't judge. :)

## License

Copyright 2017 Gerard Dombroski

Licensed under the Apache License, Version 2.0 (the "License");
you may not use these files except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.