// Copyright (c) 2019 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <seeder/dns.h>

#include <string>
#include <vector>

#include <boost/test/unit_test.hpp>

BOOST_AUTO_TEST_SUITE(dns_tests)

static const int MAX_QUERY_NAME_LENGTH = 255;
// Max size of the null-terminated buffer parse_name() writes to.
static const int MAX_QUERY_NAME_BUFFER_LENGTH = MAX_QUERY_NAME_LENGTH + 1;
static const uint8_t END_OF_NAME_FIELD = 0;

// Builds the name field of the question section of a DNS query
static std::vector<uint8_t>
CreateDNSQuestionNameField(const std::string &queryName) {
    std::vector<uint8_t> nameField;
    size_t i = 0;
    size_t labelIndex = 0;
    while (i < queryName.size()) {
        if (queryName[i] == '.') {
            // Push the length of the label and then the label
            nameField.push_back(i - labelIndex);
            while (labelIndex < i) {
                nameField.push_back(queryName[labelIndex]);
                labelIndex++;
            }
            labelIndex = i + 1;
        }
        i++;
    }
    // Push the length of the label and then the label
    nameField.push_back(i - labelIndex);
    while (labelIndex < i) {
        nameField.push_back(queryName[labelIndex]);
        labelIndex++;
    }
    nameField.push_back(END_OF_NAME_FIELD);

    return nameField;
}

static void CheckParseName(const std::string &queryName) {
    std::vector<uint8_t> nameField = CreateDNSQuestionNameField(queryName);

    // Test when name field is too short to reach null-terminator
    for (size_t nameFieldEndIndex = 0; nameFieldEndIndex < nameField.size();
         nameFieldEndIndex++) {
        std::vector<char> parsedQueryName(MAX_QUERY_NAME_BUFFER_LENGTH, 0);
        const uint8_t *nameFieldBegin = nameField.data();
        int ret = parse_name(
            &nameFieldBegin, nameFieldBegin + nameFieldEndIndex,
            nameField.data(), parsedQueryName.data(), parsedQueryName.size());

        BOOST_CHECK(ret != 0);
    }

    // Test when the buffer size is too small
    size_t outputBufferSize = 1;
    while (outputBufferSize <= queryName.size()) {
        std::vector<char> parsedQueryName(outputBufferSize, 0);
        const uint8_t *nameFieldBegin = nameField.data();
        int ret = parse_name(&nameFieldBegin, nameFieldBegin + nameField.size(),
                             nameField.data(), parsedQueryName.data(),
                             parsedQueryName.size());
        BOOST_CHECK(ret != 0);
        outputBufferSize++;
    }

    // Happy path
    while (outputBufferSize <= MAX_QUERY_NAME_BUFFER_LENGTH) {
        std::vector<char> parsedQueryName(outputBufferSize, 0);
        const uint8_t *nameFieldBegin = nameField.data();
        int ret = parse_name(&nameFieldBegin, nameFieldBegin + nameField.size(),
                             nameField.data(), parsedQueryName.data(),
                             parsedQueryName.size());
        BOOST_CHECK_EQUAL(ret, 0);
        BOOST_CHECK_EQUAL(parsedQueryName.data(), queryName);
        outputBufferSize++;
    }
}

BOOST_AUTO_TEST_CASE(parse_name_tests) {
    CheckParseName("www.domain.com");
    CheckParseName("domain.com");
    CheckParseName("sub1.sub2.domain.co.uk");
    // Shortest valid domain name is 1 char followed by the extension
    CheckParseName("a.co");
    // Domain name with valid non-alphanumeric character
    CheckParseName("my-domain.com");
}

BOOST_AUTO_TEST_SUITE_END()
