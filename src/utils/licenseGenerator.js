// Gerador de textos de LICENSE para projetos de software.
// 100% client-side: substitui os placeholders {{year}}, {{holder}} e {{project}}
// nos templates conhecidos de licenças de software livre/proprietárias.

export const LICENSES = {
  mit: {
    key: 'mit',
    name: 'MIT License',
    spdx: 'MIT',
    osi: true,
    label: { pt: 'MIT', en: 'MIT' },
    template: `MIT License

Copyright (c) {{year}} {{holder}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },

  'apache-2.0': {
    key: 'apache-2.0',
    name: 'Apache License 2.0',
    spdx: 'Apache-2.0',
    osi: true,
    label: { pt: 'Apache-2.0', en: 'Apache-2.0' },
    template: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright {{year}} {{holder}}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },

  'bsd-2': {
    key: 'bsd-2',
    name: 'BSD 2-Clause "Simplified" License',
    spdx: 'BSD-2-Clause',
    osi: true,
    label: { pt: 'BSD-2-Clause', en: 'BSD-2-Clause' },
    template: `BSD 2-Clause License

Copyright (c) {{year}}, {{holder}}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },

  'bsd-3': {
    key: 'bsd-3',
    name: 'BSD 3-Clause "New" or "Revised" License',
    spdx: 'BSD-3-Clause',
    osi: true,
    label: { pt: 'BSD-3-Clause', en: 'BSD-3-Clause' },
    template: `BSD 3-Clause License

Copyright (c) {{year}}, {{holder}}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of {{project}} nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },

  isc: {
    key: 'isc',
    name: 'ISC License',
    spdx: 'ISC',
    osi: true,
    label: { pt: 'ISC', en: 'ISC' },
    template: `ISC License

Copyright (c) {{year}}, {{holder}}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
  },

  unlicense: {
    key: 'unlicense',
    name: 'The Unlicense',
    spdx: 'Unlicense',
    osi: false,
    label: { pt: 'Unlicense', en: 'Unlicense' },
    template: `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large
and to the detriment of our heirs and successors. We intend this
dedication to be an overt act of relinquishment in perpetuity of all
present and future rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.`,
  },

  wtfpl: {
    key: 'wtfpl',
    name: 'DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE',
    spdx: 'WTFPL',
    osi: false,
    label: { pt: 'WTFPL', en: 'WTFPL' },
    template: `        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

Copyright (C) {{year}} {{holder}}

Everyone is permitted to copy and distribute verbatim or modified
copies of this license document, and changing it is allowed as long
as the name is changed.

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

 0. You just DO WHAT THE FUCK YOU WANT TO.`,
  },

  'cc0': {
    key: 'cc0',
    name: 'Creative Commons Zero v1.0 Universal',
    spdx: 'CC0-1.0',
    osi: false,
    label: { pt: 'CC0-1.0', en: 'CC0-1.0' },
    template: `Creative Commons Legal Code

CC0 1.0 Universal

    CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE
    LEGAL SERVICES. DISTRIBUTION OF THIS DOCUMENT DOES NOT CREATE AN
    ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS
    INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES
    REGARDING THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS
    PROVIDED HEREUNDER, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM
    THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED
    HEREUNDER.

Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator
and subsequent owner(s) (each and all, an "owner") of an original work of
authorship and/or a database, which is referred to as the "Work".

To the extent possible under applicable law, {{holder}} hereby waives all
Copyright and Related Rights in the Work and any associated claims, cause
of actions, lawsuits, or other legal proceedings in any jurisdiction
worldwide.

To the extent possible under applicable law, the affirmer grants a
worldwide, royalty-free, non-exclusive, irrevocable license to reproduce,
prepare Derivative Works of, publicly display, publicly perform,
sublicense, and distribute the Work.

This license is offered as a public dedication with no warranty.
`,
  },

  'mpl-2.0': {
    key: 'mpl-2.0',
    name: 'Mozilla Public License 2.0',
    spdx: 'MPL-2.0',
    osi: true,
    label: { pt: 'MPL-2.0', en: 'MPL-2.0' },
    template: `Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor" means each individual or legal entity that creates,
      contributes to, or owns the Work.

1.2. "Contributor Version" means the combination of the Work with any
      Contribution.

1.3. "Contribution" means any work of authorship that is intentionally
      submitted to the Work by the Contributor.

1.4. "Covered Software" means the Work and any Contribution.

1.5. "Executable Form" means any form of the Work other than Source Code Form.

1.6. "Larger Work" means a work that combines Covered Software with material
      governed by one or more Secondary Licenses.

1.7. "License" means this document.

1.8. "Licensable" means having the right to grant a license.

1.9. "Modifications" means any addition to or deletion from the substance or
      structure of the Work.

1.10. "Patent Claims" of a Contributor means any patent claim(s) owned or
       controlled by the Contributor.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
    Licensable by such Contributor to use, reproduce, make available,
    modify, display, perform, distribute, and otherwise exploit its
    Contributions, either on an unmodified basis, with Modifications, or
    as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer for
    sale, have made, import, and otherwise transfer either its Contributions
    or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution become
effective for each Contribution on the date the Contributor first distributes
such Contribution.

2.3. Limitations on Grant Scope

Nothing in this License shall be construed to grant any rights under any
trademark of the Licensor, and the rights granted may not be sublicensed
without separate permission from the Licensor.

3. Distribution Obligations
---------------------------

3.1. Availability of Source Code

Any Covered Software that You distribute or otherwise make available must be
made available in Source Code Form under the terms of this License.

3.2. Notices

You must remove or replace any notices in the Work stating that it is licensed
under this License.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this License
with respect to some or all of the Covered Software due to statute, judicial
order, or regulation, You must: (a) comply with the terms of this License to the
maximum extent possible; and (b) describe the limitations and the code they
affect.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically if You
fail to comply with its terms.

5.2. If You initiate litigation alleging that a Contribution constitutes
direct or contributory patent infringement, then any patent rights granted to
You under this License for that Contribution shall terminate as of the date
such litigation is filed.

6. Disclaimer of Warranty
-------------------------

Covered Software is provided under this License on an "as is" basis, without
warranty of any kind.

7. Limitation of Liability
--------------------------

Under no circumstances and under no legal theory shall any Contributor be
liable to You for any damages arising as a result of this License.

8. Litigation
-------------

Any litigation relating to this License may be brought only in the courts of a
jurisdiction where the defendant maintains its principal place of business.

END OF TERMS AND CONDITIONS

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

Copyright (c) {{year}} {{holder}}`,
  },

  proprietary: {
    key: 'proprietary',
    name: 'Proprietary License (All Rights Reserved)',
    spdx: 'Proprietary',
    osi: false,
    label: { pt: 'Proprietária', en: 'Proprietary' },
    template: `End-User License Agreement (EULA)

Copyright (c) {{year}} {{holder}}. All rights reserved.

The software, code, documentation, and any related assets contained in or
related to {{project}} (the "Software") are the exclusive property of
{{holder}} and are protected by copyright laws and international treaties.

You are granted a limited, non-exclusive, non-transferable license to use
the Software strictly in accordance with the terms agreed upon between
you and {{holder}}.

You may not copy, modify, distribute, sublicense, reverse engineer,
decompile, disassemble, or create derivative works based on the Software,
in whole or in part, without prior written permission from {{holder}}.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL
{{holder}} BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM
OR RELATED TO THE SOFTWARE.

For licensing inquiries, contact {{holder}}.`,
  },
}

export const PRESETS = {
  mit: { licenseKey: 'mit', year: '', holder: '', project: '' },
  apache: { licenseKey: 'apache-2.0', year: '', holder: '', project: '' },
  bsd2: { licenseKey: 'bsd-2', year: '', holder: '', project: '' },
  bsd3: { licenseKey: 'bsd-3', year: '', holder: '', project: '' },
  isc: { licenseKey: 'isc', year: '', holder: '', project: '' },
  mpl: { licenseKey: 'mpl-2.0', year: '', holder: '', project: '' },
  cc0: { licenseKey: 'cc0', year: '', holder: '', project: '' },
  unlicense: { licenseKey: 'unlicense', year: '', holder: '', project: '' },
  proprietary: { licenseKey: 'proprietary', year: '', holder: '', project: '' },
}

export function getLicenseKeys() {
  return Object.keys(LICENSES)
}

export function getLicenseOptions(lang = 'en') {
  return Object.values(LICENSES).map((l) => ({
    value: l.key,
    label: `${l.name} (${l.spdx})`,
    shortLabel: l.label[lang] || l.label.en,
  }))
}

export function buildLicense(options) {
  const { licenseKey = 'mit', year = '', holder = '', project = '' } = options || {}
  const license = LICENSES[licenseKey] || LICENSES.mit
  const currentYear = String(new Date().getFullYear())

  const safeYear = String(year).trim() || currentYear
  const safeHolder = String(holder).trim() || 'AUTHOR'
  const safeProject = String(project).trim() || 'this software'

  return license.template
    .replace(/{{year}}/g, safeYear)
    .replace(/{{holder}}/g, safeHolder)
    .replace(/{{project}}/g, safeProject)
}
